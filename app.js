const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const uniqid = require("uniqid");

const feedRoutes = require("../messageNodeAPI/routes/feed");
const authRoutes = require("./routes/auth")

const app = express();

const fileStorage = multer.diskStorage({
  destination: "images",
  filename: (req, file, cb) => {
    cb(null, uniqid("", `-${file.originalname}`));
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(express.json()); // application/json
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"));
app.use('/images', express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes)

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.uv3ti.mongodb.net/messages?retryWrites=true&w=majority`
  )
  .then((res) => {
    const server = app.listen(8080);
    const io = require("./socket").init(server)
    io.on("connection", socket => {
      console.log("Client connected")
    })
  })
  .catch((err) => {
    console.log(err);
  });
