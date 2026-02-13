import multer from "multer";

const storage = multer.diskStorage({ 
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  } 
})
// multer:- it parses multipart(form-data) data
export const upload = multer({ 
    // storage: storage    --> as we are using es6 in  which if values are same then no require to write it multiples times 
    storage,
 }) 