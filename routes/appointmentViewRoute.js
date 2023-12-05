const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

router.get("/", (req, res) => {
    const user = req.session.user;
    if (typeof user == "undefined" || user.role != "User") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
    res.redirect(`/home`);
});

router.get("/:id", (req, res) => {
    const user = req.session.user;
    const id = req.params.id;
    if (typeof user == "undefined" || user.role != "User") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }

    db.collection('appointment').doc(`${id}`).get().then(data => {
        let appointmentData = [];
        appointmentData.push(data.data())
        res.render("appointmentView", { user: user, appointment: appointmentData });
    })
});

router.post('/', async (req, res) => {
    try {
        const { fullname, email, contactnumber, date, time, purpose,} = req.body;
        const status = "pending";
        await db.collection('appointment').add({
            fullname, 
            email, 
            contactnumber, 
            date,
            time,
            purpose,
            status,
            viewed: false
        });
        res.redirect(`/home`);
    } catch (error) {
      res.status(500).send(error.message);
    }
});

module.exports = router;