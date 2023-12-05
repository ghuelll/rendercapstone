const express = require("express");
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

function calculateCategoryCounts(data) {
    const categoryCounts = {};
    data.forEach((item) => {
        const category = item.category;
        if (!categoryCounts[category]) {
            categoryCounts[category] = 0;
        }
        categoryCounts[category]++;
    });
    return categoryCounts;
}

router.get("/", (req, res) => {
    const user = req.session.user;
    if (typeof user == "undefined" || user.role != "Admin") {
        try {
            res.redirect("/login");
        } catch (error) {
            
        }
    }
    const collectionRef = db.collection('lost');
    const lostCollectionRef = db.collection('lost');
    const foundCollectionRef = db.collection('found');
    const usersCollectionRef = db.collection('users');

    Promise.all([collectionRef.get(), lostCollectionRef.get(), foundCollectionRef.get(), usersCollectionRef.get()])
        .then(([snapshot, lostSnapshot, foundSnapshot, usersSnapshot]) => {
            const data = [];
            const lostData = [];
            const foundData = [];
            const usersData = [];

            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });

            lostSnapshot.forEach((doc) => {
                lostData.push({ id: doc.id, ...doc.data() });
            });

            foundSnapshot.forEach((doc) => {
                foundData.push({ id: doc.id, ...doc.data() });
            });

            usersSnapshot.forEach((doc) => {
                usersData.push({ id: doc.id, ...doc.data() });
            });

            const totalItems = foundData.length + lostData.length;
            const foundItems = foundData.length;
            const lostItems = lostData.length;
            const totalUsers = usersData.length;
            
            const categoryCounts = calculateCategoryCounts(data);
            const categories = Object.keys(categoryCounts);
            const counts = categories.map((category) => categoryCounts[category]);
            const now = new Date();
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(now.getFullYear() - 1);
        
            const weeklyLostItems = lostData.filter(item => new Date(item.datetime) >= lastWeek);
            const weeklyFoundItems = foundData.filter(item => new Date(item.datetime) >= lastWeek);
            const monthlyLostItems = lostData.filter(item => new Date(item.datetime) >= oneYearAgo);
            const monthlyFoundItems = foundData.filter(item => new Date(item.datetime) >= oneYearAgo);
            const pendingLostItems = lostData.filter(item => item.status === 'Pending').length;
            const claimedLostItems = lostData.filter(item => item.status === 'Claimed').length;
            const pendingFoundItems = foundData.filter(item => item.status === 'Pending').length;
            const claimedFoundItems = foundData.filter(item => item.status === 'Claimed').length;

            const totalPendingItems = pendingLostItems + pendingFoundItems;
            const totalClaimedItems = claimedLostItems + claimedFoundItems;

            const foundCategoryCounts = calculateCategoryCounts(foundData);
            const sortedFoundCategories = Object.keys(foundCategoryCounts).sort(
                (a, b) => foundCategoryCounts[b] - foundCategoryCounts[a]
            );

            const highestCategory = sortedFoundCategories[0];
            const lowestCategory = sortedFoundCategories[sortedFoundCategories.length - 1];
            const barChartFoundData = {
                labels: sortedFoundCategories,
                datasets: [{
                    data: sortedFoundCategories.map(category => foundCategoryCounts[category]),
                    backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', 'grey', 'brown', 'orange'],
                }],
            };

            const weeklyChartData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(lastWeek);
                date.setDate(lastWeek.getDate() + i);
                const formattedDate = date.toDateString();
                const lostCount = weeklyLostItems.filter(item => new Date(item.datetime).toDateString() === formattedDate).length;
                const foundCount = weeklyFoundItems.filter(item => new Date(item.datetime).toDateString() === formattedDate).length;
                weeklyChartData.push({ date: formattedDate, lost: lostCount, found: foundCount });
            }

            const monthlyChartData = [];
            for (let i = 0; i < 12; i++) {
                const startOfMonth = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + i, 1);
                const endOfMonth = new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth() + i + 1, 0);
                const formattedMonth = startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
                const lostCount = monthlyLostItems.filter(item => new Date(item.datetime) >= startOfMonth && new Date(item.datetime) <= endOfMonth).length;
                const foundCount = monthlyFoundItems.filter(item => new Date(item.datetime) >= startOfMonth && new Date(item.datetime) <= endOfMonth).length;
                monthlyChartData.push({ month: formattedMonth, lost: lostCount, found: foundCount });
            }

            const lostDepartments = calculateDepartmentCounts(lostData);
            const foundDepartments = calculateDepartmentCounts(foundData);
            const combinedDepartments = combineDepartmentData(lostDepartments, foundDepartments);

            function calculateDepartmentCounts(data) {
                const departmentCounts = {};
                data.forEach((item) => {
                    const department = item.department;
                    if (!departmentCounts[department]) {
                        departmentCounts[department] = 0;
                    }
                    departmentCounts[department]++;
                });
                return departmentCounts;
            }
            
            function combineDepartmentData(lostData, foundData) {
                const combinedData = {};
            
                for (const department in lostData) {
                    if (combinedData[department]) {
                        combinedData[department].lost = lostData[department];
                    } else {
                        combinedData[department] = { lost: lostData[department] };
                    }
                }
            
                for (const department in foundData) {
                    if (combinedData[department]) {
                        combinedData[department].found = foundData[department];
                    } else {
                        combinedData[department] = { found: foundData[department] };
                    }
                }
            
                return combinedData;
            }
            
            res.render('admin/admin-dashboard', {
                data: { lost: lostData, found: foundData },
                location: "Lost and Found",
                totalItems: totalItems,
                foundItems: foundItems,
                lostItems: lostItems,
                totalUsers: totalUsers,
                categories: categories,
                lostCounts: counts, 
                weeklyChartData: weeklyChartData,
                monthlyChartData: monthlyChartData,
                highestFoundCategory: highestCategory,
                lowestFoundCategory: lowestCategory,
                barChartFoundData: barChartFoundData,
                totalPendingItems: totalPendingItems,
                totalClaimedItems: totalClaimedItems,
                combinedDepartments: combinedDepartments,

            });
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
                data.push({ id: doc.id, ...doc.data() });
            });
            res.render('admin/admin-dashboard', { data: data, location: "Lost" });
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
});

router.get("/found", (req, res) => {
    // Fetch data from a Firestore collection
    const collectionRef = db.collection('found');
    collectionRef.get()
        .then((snapshot) => {
            const data = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            res.render('admin/admin-dashboard', { data: data, location: "Found" });
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
});

module.exports = router;