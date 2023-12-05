const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const sessionStorage = require('node-sessionstorage')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey("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")
require("firebase/compat/auth");

router.get("/", (req, res) => {
    res.render('forgotPassword');
})

router.post("/", async (req, res) => {
    const { email } = req.body;
    const userRef = db.collection('users');
    const data = [];

    userRef.get().then(async (snapshot) => {
        snapshot.forEach((doc) => {
            data.push(doc.data());
        });
        let index = 0;
        data.forEach((user) => {
            if (user.email == email) {
                const actionCodeSettings = {
                    url: 'http://localhost:3000/login',
                };

                admin.auth().generatePasswordResetLink(email, actionCodeSettings)
                .then((link) => {
                    console.log(link)
                    const message = `<p>Change your password here: ${link}</p>`;
                    const msg = {
                        to: user.email,
                        from: 'ti.philippines.edu@gmail.com',
                        subject: 'Change Password',
                        text: `Change Password`,
                        html: message,
                    }
                    sgMail.send(msg).then(() => {
                        console.log("Email sent")
                    })
                    .catch((error) => {
                        console.error(error)
                    })
                    res.render('forgotPassword', { user: true });
                })
                .catch((error) => {
                    console.error(error)
                });
            } else if (user.email != email && index == data.length) {
                res.render('forgotPassword', { user: false });
            }
            index++;
        })
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

module.exports = router;
