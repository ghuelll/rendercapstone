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
  res.render("found", { user: user });
});
  
router.post('/', upload.single('file'), async (req, res) => {
    try {
      const { studentNum, firstName, email, contactNum, location, building, datetime, objTitle, sameAddress, category, description, department } = req.body;
      const status = "Pending";
      const image = req.file;
      const foundItemRef = await db.collection('found').add({
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
        type: "found",
        retrieveDate: "",
        retrievedBy: "",
        dataAdded: new Date(),
        image: `/images/${image.filename}`,
        status,
      });
      const foundItem = await foundItemRef.get();
      res.redirect(`/preview/found/${foundItem.id}`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create a found item' });
    }
});

router.put('/:id', upload.single('file'), async (req, res) => {
    try {
      const itemId = req.params.id;
      const { studentNum, firstName, email, contactNum, location, building, datetime, objTitle, sameAddress, category, description, department } = req.body;
      const status = "Pending";
      const image = req.file;
      await db.collection('found').doc(itemId).update({
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
      res.redirect(`/preview/found/${itemId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update the found item' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
      const itemId = req.params.id;
      
      await db.collection('found').doc(itemId).delete();
  
      res.status(200).json({ message: 'found item deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete the found item' });
    }
});

module.exports = router;