const multer = require("multer");
const path = require('path');


const uploadDisk = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'images')
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`)
    }
  })
})

module.exports = {
  uploadDisk
}
