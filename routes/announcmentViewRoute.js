const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'images');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage: storage });

  router.get("/ann", (req, res) => {
    const user = req.session.user;
    res.render("announcementView", { user: user });

});

router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { subject, thoughts } = req.body;
        const image = req.file;
        await db.collection('announcement').add({
            subject, 
            thoughts,
            image: `/images/${image.filename}`,
        });
        res.redirect(`announcementView`);
    } catch (error) {
      res.status(500).send(error.message);
    }
});

router.get("/", (req, res) => {
    const user = req.session.user;
    if (typeof user == "undefined" || user.role != "User") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
    const notificationRef = db.collection('announcement').orderBy("date", "desc");
    const collectionRef = db.collection('announcement').orderBy("date", "asc");
    notification = []
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        const images = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data()});
        });
        
        notificationRef.get().then((notif) => {
          
          notif.forEach((doc) => {
              var message = doc.data().thoughts;
              
              notification.push({ id: doc.id, message: message });
          });

          res.render('announcementView', {data: data, user: user, notification: notification} );
        });

    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });

});

router.get('/delete/:id', async (req, res) => {
    try {
      const itemId = req.params.id;
      
      await db.collection("announcement").doc(itemId).delete();
      res.redirect(`/announcementView`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete the lost item' });
    }
});

module.exports = router;