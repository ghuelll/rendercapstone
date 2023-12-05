const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const multer = require('multer');

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

router.get("/lost/:id", (req, res) => {
    const user = req.session.user;
    if (typeof user == "undefined" || user.role != "User") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('lost').doc(req.params.id);
    collectionRef.get()
    .then((snapshot) => {
        res.render('previewItem', { data: snapshot.data(),id: snapshot.id, id: snapshot.data().id, location: "lost", user: req.session.user });
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

router.get("/found/:id", (req, res) => {
    const user = req.session.user;
    if (typeof user == "undefined" || user.role != "User") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('found').doc(req.params.id);
    collectionRef.get()
    .then((snapshot) => {
        res.render('previewItem', { data: snapshot.data(), id: snapshot.data().id, location: "found", user: req.session.user });
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

module.exports = router;