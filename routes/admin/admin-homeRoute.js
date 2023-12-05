const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

router.get("/", async (req, res) => {
    const user = req.session.user;
    if (typeof user == "undefined" || user.role != "Admin") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
    // Fetch data from a Firestore collection
    const lostRef = db.collection('lost');
    await lostRef.get()
    .then((snapshot) => {
        db.collection('found').get().then((found) => {
            const data = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            found.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            data.sort((a, b) => {
                let da = new Date(a.dataAdded.toDate()),
                    db = new Date(b.dataAdded.toDate());
                return db - da;
            });
            res.render('admin/admin-home', {data: data } );
        })
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    })
});

module.exports = router;