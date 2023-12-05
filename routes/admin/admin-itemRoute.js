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
            if (doc.data().status != "Archived") {
                data.push({ id: doc.id, ...doc.data() });
            }
        });
        res.render('admin/admin-item', {data: data, location: "Lost", category: "all"} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

router.get("/", (req, res) => {
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('found');
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            if (doc.data().status != "Archived") {
                data.push({ id: doc.id, ...doc.data() });
            }
        });
        res.render('admin/admin-item', {data: data, location: "found", category: "all"} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

router.get("/:category/lost", (req, res) => {
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('lost');
    const category = req.params.category;
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            if (category.toLowerCase() != "all") {
                if (doc.data().category.toLowerCase() == category.toLowerCase() ) {
                    data.push({ id: doc.id, ...doc.data() });
                } 
            } else {
                data.push({ id: doc.id, ...doc.data() });
            }
        });
        res.render('admin/admin-item', {data: data, location: "lost", category: category} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

router.get("/:category/found", (req, res) => {
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('found');
    const category = req.params.category;
    collectionRef.get()
    .then((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
            if (category.toLowerCase() != "all") {
                if (doc.data().category.toLowerCase() == category.toLowerCase()) {
                    data.push({ id: doc.id, ...doc.data() });
                } 
            } else {
                data.push({ id: doc.id, ...doc.data() });
            }
        });        
        res.render('admin/admin-item', {data: data, location: "found", category: category} );
    })
    .catch((error) => {
        console.error('Error fetching data:', error);
    });
});

module.exports = router;