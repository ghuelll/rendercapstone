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
    res.render("feedback", { user: user });
});

router.post('/', async (req, res) => {
    try {
        const { fullname, email, contactnumber, subject, thoughts } = req.body;
        await db.collection('feedback').add({
            fullname, 
            email, 
            contactnumber, 
            subject, 
            thoughts
        });
        res.redirect(`/home`);
    } catch (error) {
      res.status(500).send(error.message);
    }
});

module.exports = router;