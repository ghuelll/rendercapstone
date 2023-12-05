const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const multer = require('multer');
const db = admin.firestore()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'images'); // create an image folder
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });

const upload = multer({ storage: storage });

router.get("/", (req, res) => {
  const user = req.session.user;
  if (typeof user == "undefined" || user.role != "User") {
      try {
          res.redirect("/login");
      } catch (error) {
          
      }
  }
  res.render("lost", { user: user });
});
  
router.post('/', upload.single('file'), async (req, res) => {
    try {
      const { studentNum, firstName, email, contactNum, location, building, datetime, objTitle, sameAddress, category, description, department } = req.body;
      const status = "Pending";
      const image = req.file;
      const lostItemRef = await db.collection('lost').add({
        studentNum,
        firstName,
        email,
        contactNum,
        location,
        building, 
        datetime, 
        objTitle, 
        sameAddress: sameAddress ? true:false,
        category,
        description,
        department,
        type: "lost",
        retrieveDate: "",
        retrievedBy: "",
        dataAdded: new Date(),
        image: `/images/${image.filename}`,
        status,
      });
      const lostItem = await lostItemRef.get();
      res.redirect(`/preview/lost/${lostItem.id}`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create a lost item' });
    }
});

router.put('/:id', upload.single('file'), async (req, res) => {
    try {
      const itemId = req.params.id;
      const { studentNum, firstName, email, contactNum, location, building, datetime, objTitle, sameAddress, category, description, department } = req.body;
      const status = "Pending";
      const image = req.file;
      await db.collection('lost').doc(itemId).update({
        studentNum,
        firstName,
        email,
        contactNum,
        location,
        building,
        datetime, 
        objTitle, 
        sameAddress: sameAddress ? true:false,
        category,
        description,
        department,
        retrieveDate: "",
        retrievedBy: "",
        image: `/images/${image.filename}`,
        status,
      });
      res.redirect(`/preview/lost/${itemId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update the lost item' });
    }
});

module.exports = router;