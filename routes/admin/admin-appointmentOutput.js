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
    const collectionRef = db.collection('appointment');
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        console.log(data)
        res.render('admin/admin-appointmentOutput', {data: data} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

router.get('/delete/:id', async (req, res) => {
    try {
      const itemId = req.params.id;
      
      await db.collection("appointment").doc(itemId).delete();
      res.redirect('/admin-appointmentOutput');
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete the lost item' });
    }
});


router.get('/approve/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const doc = await db.collection("appointment").doc(itemId).get();
        const currentStatus = doc.data().status;
        const message = "Your appointment has been approved";
        const studeNum = doc.data().email;
        // console.log(doc.data())
        await db.collection('notif').add({
            studeNum,
            message
        });
        if (currentStatus === "pending") {
            await db.collection("appointment").doc(itemId).update({ status: "approved" });
            res.redirect('/admin-appointmentOutput');
        } else {
            res.status(400).json({ error: 'Appointment status cannot be changed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to approve the appointment' });
    }
});

router.get('/decline/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const doc = await db.collection("appointment").doc(itemId).get();
        const currentStatus = doc.data().status;
        const message = "Your appointment has been declined";
        const studeNum = doc.data().email;
        // console.log(doc.data())
        await db.collection('notif').add({
            studeNum,
            message
        });
        if (currentStatus === "pending") {
            await db.collection("appointment").doc(itemId).update({ status: "declined" });
            res.redirect('/admin-appointmentOutput');
        } else {
            res.status(400).json({ error: 'Appointment status cannot be changed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to decline the appointment' });
    }
});


module.exports = router;