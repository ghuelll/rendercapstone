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
        res.render('admin/admin-updateUser');
});


module.exports = router;