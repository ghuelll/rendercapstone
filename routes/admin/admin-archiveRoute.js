const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

router.get("/", (req, res) => {
    const user = req.session.user;
    if (typeof user == "undefined" || user.role != "Admin") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('lost');
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            if (doc.data().status == "Archived") {
                data.push({ id: doc.id, ...doc.data() });
            }
        });
        res.render('admin/admin-archive', {data: data, location: "Lost"} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

router.get("/lost", (req, res) => {
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('lost');
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            if (doc.data().status == "Archived") {
                data.push({ id: doc.id, ...doc.data() });
            }
        });
        res.render('admin/admin-archive', {data: data, location: "Lost"} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
})

router.get("/found", (req, res) => {
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('found');
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            if (doc.data().status == "Archived") {
                data.push({ id: doc.id, ...doc.data() });
            }
        });
        res.render('admin/admin-archive', {data: data, location: "Found"} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
})

router.get("/announcement", (req, res) => {
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('announcement');
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            if (doc.data().status == "Archived") {
                data.push({ id: doc.id, ...doc.data() });
            }
        });
        res.render('admin/admin-archive', {data: data, location: "Announcement"} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
})

router.get('/unarchive/:location/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const location = req.params.location;

        const collectionRef = db.collection(location).doc(itemId);
        await collectionRef.update({status: "Pending"});
        res.redirect(`/admin-archive/${location}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to archive the lost item' });
    }
});

router.get('/delete/:location/:id', async (req, res) => {
    try {
      const itemId = req.params.id;
      const location = req.params.location;
      
      await db.collection(location).doc(itemId).delete();
      res.redirect(`/admin-archive/${location}`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete the lost item' });
    }
});

module.exports = router;