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

router.get("/:location/:id", (req, res) => {
    const user = req.session.user;
    if (typeof user == "undefined" || user.role != "Admin") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
    const location = req.params.location; 
    if (location === "lost" || location === "found") {
        const collectionRef = db.collection(location).doc(req.params.id);

        collectionRef.get()
        .then((snapshot) => {
            if (snapshot.exists) {
                res.render('admin/admin-updateItem', { data: snapshot.data(), id: req.params.id, location: location });
            } else {
                res.status(404).send("Item not found");
            }
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
            res.status(500).send("Error fetching data");
        });
    } else {
        res.status(400).send("Invalid location parameter");
    }
});


router.post('/:location/update/:id', upload.single('file'), async (req, res) => {
    try {
        const location = req.params.location; 
        if (location === "lost" || location === "found") {
            const itemId = req.params.id;
            const { studentNum, firstName, email, contactNum, datetime, objTitle, sameAddress, category, description, department, prevImage } = req.body;
            const image = req.file;
            
            const dataToUpdate = {
                studentNum,
                firstName,
                email,
                contactNum,
                datetime, 
                objTitle, 
                sameAddress: sameAddress ? "true" : "false",
                category,
                description, 
                department,
                retrieveDate: "",
                retrievedBy: "",
                image: `${image ? '/images/' + image.filename : prevImage}`,
            };
            
            // Construct the Firestore collection reference based on the location
            const collectionRef = db.collection(location).doc(itemId);

            await collectionRef.update(dataToUpdate);
            res.redirect('/admin-view/' + location + '/' + itemId);
        } else {
            res.status(400).json({ error: 'Invalid location parameter' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update the item' });
    }
});

module.exports = router;