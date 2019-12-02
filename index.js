//Dependencies installed : express mongoose ejs multer multer-gridfs-storage   nodemon -D (for developing)


//MODULES
const express = require("express");
const app = express();

//SETTINGS
app.set("port" , process.env.PORT || 3104)

//MIDDLEWARES
app.use(express.json());
app.set("view engine", "ejs");

//ROUTES
app.use(require("./routes/index"))

//SERVER
app.listen(app.get("port"), () => {
  console.log("server on port " + app.get("port"));
});