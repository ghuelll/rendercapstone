const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey("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")
const fs = require('fs');

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
    if (typeof user == "undefined" || user.role != "Admin") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
  res.render("admin-announcement", { user: user });

});

router.post('/', upload.single('file'), async (req, res) => {
    const user = req.session.user;
    if (typeof user == "undefined" || user.role != "Admin") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
    try {
        const collectionRef = db.collection('users');
        collectionRef.get()
          .then(async (snapshot) => {
            const { subject, thoughts } = req.body;
            const image = req.file;
            const message = `<p>${thoughts}</p>`;
            await db.collection('announcement').add({
                subject,
                thoughts,
                image: `/images/${image.filename}`,
                date: new Date(),
                viewedBy: []
            })
            snapshot.forEach((doc) => {
              const data = [];
              data.push(doc.data());
              data.forEach((user) => {
                if (user.email || user.email != "") {
                  const msg = {
                    to: user.email,
                    from: 'ti.philippines.edu@gmail.com',
                    subject: `${subject}`,
                    text: `${thoughts}`,
                    html: message,
                  }
                  sgMail.send(msg).then(() => {
                    console.log("Email sent")
                  })
                  .catch((error) => {
                    console.error(error)
                  })
                  collectionRef.doc(`${user.id}`).set({
                    viewedAnnouncement: false 
                  });
                }
              })
            });
            db.collection('announcement').orderBy("date", "desc").get().then((snapshot) => {
              const data = [];
              const images = [];
              snapshot.forEach((doc) => {
                  data.push({ id: doc.id, ...doc.data()});
              });
            res.render('admin/announcementList', {data: data, user: user} );
            })
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
    } catch (error) {
      res.status(500).send(error.message);
    }
});

router.get('/archive/:id', async (req, res) => {
  try {
      const itemId = req.params.id;
      const location = req.params.location;

      const collectionRef = db.collection("announcement").doc(itemId);
      await collectionRef.update({status: "Archived"});
      res.redirect(`/admin-announcementList`);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to archive the lost item' });
  }
});

router.get("/", (req, res) => {
  const user = req.session.user;
  if (typeof user == "undefined" || user.role != "Admin") {
      try {
          res.redirect("/login");
      } catch (error) {
          
      }
  }

    const collectionRef = db.collection('announcement').orderBy("date", "desc");
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        const images = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data()});
        });
        res.render('admin/announcementList', {data: data, user: user} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });

});

router.get('/delete/:id', async (req, res) => {
    try {
      const itemId = req.params.id;
      
      await db.collection("announcement").doc(itemId).delete();
      res.redirect(`/admin-announcementList`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete the lost item' });
    }
});

module.exports = router;