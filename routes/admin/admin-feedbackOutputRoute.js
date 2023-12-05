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
    const collectionRef = db.collection('feedback');
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        res.render('admin/admin-feedbackoutput', {data: data} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

router.get('/delete/:id', async (req, res) => {
    try {
      const itemId = req.params.id;
      
      await db.collection("feedback").doc(itemId).delete();
      res.redirect(`/admin-feedbackoutput`);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete the lost item' });
    }
});

module.exports = router;