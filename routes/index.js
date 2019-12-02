const router = require("express").Router() 
const mongoose = require("mongoose") 
const crypto = require("crypto") 
const path = require("path")  
const multer = require("multer") // Manage files/images
const GridFsStorage = require("multer-gridfs-storage") //manage files/images



//DATABASE
const mongoURI = "mongodb://localhost/images-gridfs-db"
const conn = mongoose.createConnection(mongoURI , {
    useNewUrlParser : true , 
    useUnifiedTopology : true
})



//GRIDFS 
let gfs;
conn.once("open" , () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db , { // Here is created a collection called uploads inside the DB
        bucketName : "uploads"
    })
})

//GRIDFS STORAGE
const storage = new GridFsStorage({
    url: mongoURI,    // What DB the files are gonna be stored
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString("hex") + path.extname(file.originalname); 
          const fileInfo = { // What name the file is gonna have and in what collection will be stored
            filename: filename,
            bucketName: "uploads"
          };
          resolve(fileInfo);
        });
      });
    }
  });
  
  const upload = multer({storage});



//ROUTES
router.get("/", (req, res) => {
    if(!gfs) { // Manage errors
      console.log("some error occured, check connection to db");
      res.send("some error occured, check connection to db");
      process.exit(0);
    }
    gfs.find().toArray((err, files) => { // Look for all the files
      if (!files || files.length === 0) {  // If there are not files
        return res.render("index", {
          files: false
        });
      } else { // If there are files
        const f = files
          .map(file => {
            if (file.contentType === "image/png" ||file.contentType === "image/jpeg") { // If it is png or jpeg is an image
              file.isImage = true;
            } else { // If it is not png or jpeg is not an image
              file.isImage = false;
            }
            return file;
          })
          .sort((a, b) => { // Here we order the files from most recent to least recent
            return (
              new Date(b["uploadDate"]).getTime() -
              new Date(a["uploadDate"]).getTime()
            );
          });

        return res.render("index", { // The index.ejs is renderized 
          files: f
        });
      }
    });
});

router.post("/upload", upload.single("file"), (req, res) => { // when a file is submitted through the form 
    res.redirect("/")                                         //upload.single() , that´s the function that save the files ,  
});                                                           //is activated and the user´s view redirected to index.ejs

router.get("/image/:filename", (req, res) => { // When a file is required by its name
    const file = gfs
      .find({ // The file is looked by its name
        filename: req.params.filename
      })
      .toArray((err, files) => {
        if (!files || files.length === 0) { // If it´s not founded 
          return res.status(404).json({
            err: "no files exist"
          });
        }
        gfs.openDownloadStreamByName(req.params.filename).pipe(res); // If it´s founded the user will see the image in complete screen
      });
});  

router.post("/image/delete/:id", (req, res) => { // When a file is required by id for be removed
  gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => { // The is looked by id and gets removed
    if (err) return res.status(404).json({ err: err.message });
    res.redirect("/"); // The user´s view is redirected to index.js page
  });
});

module.exports = router