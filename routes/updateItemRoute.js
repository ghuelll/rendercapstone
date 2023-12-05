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
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('lost').doc(req.params.id);
    collectionRef.get()
    .then((snapshot) => {
        res.render('updateItem', { data: snapshot.data(), id: snapshot.data().id, location: "lost", user: req.session.user });
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

router.post('/lost/update/:id', upload.single('file'), async (req, res) => {
    try {
        const itemId = req.params.id;
        const { studentNum, firstName, email, contactNum, location, datetime, objTitle, sameAddress, category, description, department, prevImage } = req.body;
        const image = req.file;
        await db.collection('lost').doc(itemId).update({
            studentNum,
            firstName,
            email,
            contactNum,
            location,
            datetime, 
            objTitle, 
            sameAddress: sameAddress ? "true":"false",
            category,
            description, 
            department,
            retrieveDate: "",
            retrievedBy: "",
            image: `${image ? '/images/'+image.filename : prevImage}`,
        });
        res.redirect('/view/lost/' + req.params.id);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update the lost item' });
    }
});

router.get("/found/:id", (req, res) => {
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('found').doc(req.params.id);
    collectionRef.get()
    .then((snapshot) => {
        res.render('updateItem', { data: snapshot.data(), id: snapshot.data().id, location: "lost", user: req.session.user });
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

router.post('/found/update/:id', upload.single('file'), async (req, res) => {
    try {
        const itemId = req.params.id;
        const { studentNum, firstName, email, contactNum, location, datetime, objTitle, sameAddress, category, description, department } = req.body;
        const image = req.file;
        await db.collection('found').doc(itemId).update({
            studentNum,
            firstName,
            email,
            contactNum,
            location,
            datetime, 
            objTitle, 
            sameAddress: sameAddress ? true:false,
            category,
            description, 
            department,
            retrieveDate: "",
            retrievedBy: "",
            image: `/images/${image.filename}`,
        });
        res.redirect('/view/found/' + req.params.id);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update the found item' });
    }
});

module.exports = router;