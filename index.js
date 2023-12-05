const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const firebase = require('./firebase');
const path = require("path");
const router = express.Router();
const admin = require("firebase-admin");
const credentials = require("./key.json");
require("firebase/compat/auth");
const sessionStorage = require('node-sessionstorage')
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey("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")

const app = express();
const port = 3000;

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

const db = admin.firestore();
const messaging = admin.messaging();

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(session({
  secret: '0gpaTAgSVgfTy5RD5Lc4h40PNusAY53Uz9N3XHkQ', 
  resave: false,
  saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));

//Admin Routes
const adminHomeRoute = require('./routes/admin/admin-homeRoute');
const appointmentOutput = require('./routes/admin/admin-appointmentOutput');
const dashboardRoute = require('./routes/admin/admin-dashboard');
const inventoryRoute = require('./routes/admin/admin-inventoryRoute');
const archiveRoute = require('./routes/admin/admin-archiveRoute');
const feedbackOutputRoute = require('./routes/admin/admin-feedbackOutputRoute');
const adminfoundRoute = require('./routes/admin/admin-foundRoute');
const adminlostRoute = require('./routes/admin/admin-lostRoute');
const adminitemRoute = require('./routes/admin/admin-itemRoute');
const adminviewItemRoute = require('./routes/admin/admin-viewItemRoute');
const adminupdateItemRoute = require('./routes/admin/admin-updateItemRoute');
const adminannouncementlistRoute = require('./routes/admin/announcementListRoute');
const adminretrieveItemRoute = require('./routes/admin/admin-retrieveItemRoute');
const adminusersRoute = require('./routes/admin/admin-users');
const adminupdateUserRoute = require('./routes/admin/admin-updateUserRoute');

const foundRoute = require('./routes/foundRoute');
const viewItemRoute = require('./routes/viewItemRoute');
const previewItemRoute = require('./routes/previewItemRoute');
const updateItemRoute = require('./routes/updateItemRoute');
const itemRoute = require('./routes/itemRoute');
const lostRoute = require('./routes/lostRoute');
const appointmentRoute = require('./routes/appointmentRoute');
const appointmentViewRoute = require('./routes/appointmentViewRoute');
const homeRoute = require('./routes/homeRoute');
const feedbackRoute = require('./routes/feedbackRoute');
const announcementViewRoute = require('./routes/announcmentViewRoute');
const forgotPasswordRoute = require('./routes/forgotPasswordRoute');

//---------------------------------------------------------------------------
//Use route modules (Admin)
app.use('/',adminHomeRoute);
app.use('/admin-home',adminHomeRoute);
app.use('/admin-dashboard', dashboardRoute);
app.use('/admin-appointmentOutput', appointmentOutput);
app.use('/admin-inventory', inventoryRoute);
app.use('/admin-archive', archiveRoute);
app.use('/admin-feedbackoutput', feedbackOutputRoute);
app.use('/admin-found', adminfoundRoute);
app.use('/admin-lost', adminlostRoute);
app.use('/admin-item', adminitemRoute);
app.use('/admin-view', adminviewItemRoute);
app.use('/admin-update', adminupdateItemRoute);
app.use('/admin-announcementlist' , adminannouncementlistRoute);
app.use('/admin-retrieveItem', adminretrieveItemRoute);
app.use('/admin-users', adminusersRoute);
app.use('/admin-updateUser', adminupdateUserRoute);

app.use('/found', foundRoute);
app.use('/view', viewItemRoute);
app.use('/preview', previewItemRoute);
app.use('/update', updateItemRoute);
app.use('/item', itemRoute);
app.use('/appointment', appointmentRoute);
app.use('/appointmentView', appointmentViewRoute);
app.use('/lost', lostRoute);
app.use('/home', homeRoute);
app.use('/feedback', feedbackRoute);
app.use('/announcementView' , announcementViewRoute);
app.use('/forgotPassword' , forgotPasswordRoute);

app.use("/images", express.static("./images"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// LOGIN
app.get("/login", (req, res) => {
  const userAuth = req.session.user;
  if (typeof userAuth != "undefined") {
    if (userAuth.role == "User") {
      try {
          res.redirect("/home");
      } catch (error) {
          
      }
    } else if (typeof userAuth != "undefined") {
      try {
        res.redirect("/");
      } catch (error) {
          
      }
    }
  } else {
    res.render("login");
  }
});

app.post("/login", async (req, res) => {

  const { email, password } = req.body;
  try {

    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.data();
    if (userData ) {
      if  (typeof userData.emailVerified == "undefined" || userData.emailVerified) {
        if (userData.role) {
          const role = userData.role;
          if (role === 'Admin') {
            req.session.user = {
              role: "Admin"
            }
            res.redirect("/admin-home");
          } else if (role === 'User') {
            sessionStorage.setItem('role', "User");
            req.session.user = {
              name: userData.firstName +' '+ userData.lastName,
              studentNumber: userData.studentNumber,
              email: user.email,
              contactNumber: userData.contactNumber,
              role: "User"
            };
            res.redirect("/home");
          } else {
            res.redirect("/login?status=unknown-role");
          }
        } else {
          res.redirect("/login?status=missing-user-data");
        }
      } else {
        res.redirect("/login?status=email-not-verified");
      }
    } else {
      res.redirect("/login?status=error");
    }

  } catch (error) {
    console.error(error);
    res.redirect("/login?status=error");
  }
});

// REGISTER
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { email, password, firstName, lastName, studentNumber, contactNumber, role } = req.body;
  const generatedCode = Math.floor(1000000000 + Math.random() * 9000000000);
  try {
    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);

    const user = userCredential.user;

    // Send email verification
    const actionCodeSettings = {
      url: 'http://localhost:3000/login', // Replace with the URL where users will be redirected after clicking the link
    };

    await user.sendEmailVerification(actionCodeSettings);

    // Send email using SendGrid
    const message = `<p>Click the following link to verify your email: http://localhost:3000/verify-email/${generatedCode}</p>`;
    const msg = {
        to: email,
        from: 'ti.philippines.edu@gmail.com',
        subject: 'Verification Code',
        text: `Verification Code`,
        html: message,
    }
    sgMail.send(msg).then(() => {
        console.log("Email sent")
    })
    .catch((error) => {
        console.error(error)
    })
    console.log(`http://localhost:3000/verify-email/${generatedCode}`)

    // Update user profile
    await user.updateProfile({
      displayName: `${firstName} ${lastName} (${studentNumber}) (${contactNumber})`
    });

    // Save user data to Firestore
    await db.collection("users").doc(user.uid).set({
      firstName,
      lastName,
      studentNumber,
      email,
      contactNumber,
      role,
      viewedAnnouncement: false,
      emailVerificationCode: generatedCode,
      emailVerified: false,
    });

    res.redirect("/login?status=register");
  } catch (error) {
    console.error(error);
    res.redirect("/register?status=error");
  }
});

app.get('/verify-email/:oobCode', async (req, res) => {
  const oobCode = req.params.oobCode;
  
  try {
    // Check the code in your database
    db.collection("users").get().then(data => {
      const userData = [];
      let user = "";

      data.forEach(doc => {
        userData.push({id: doc.id, ...doc.data()});
      })

      var index = 0;
      userData.forEach(snapshot => {
        if (typeof snapshot.emailVerificationCode != "undefined" && snapshot.emailVerificationCode == oobCode) {
          user = userData[index].id;
        }
        index++;
      })
      if (typeof user != "undefined" && user!="") {
        db.collection("users").doc(`${user}`).update({ emailVerified: true, emailVerificationCode: null }).then(data => {
          res.redirect('/login?status=email-verified');
        }).catch(err => {
          console.error(err)
        })
      } else {
        res.redirect('/login?status=invalid-verification-code');
      }
    })
  } catch (error) {
    console.error('Email verification error:', error);
    res.redirect('/login?status=email-verification-error');
  }
});

// app.post("/register", async (req, res) => {
//   const { email, password, firstName, lastName, studentNumber, contactNumber, role } = req.body;
//   try {
//     const userCredential = await firebase
//       .auth()
//       .createUserWithEmailAndPassword(email, password);
//     const user = userCredential.user;
//     await user.updateProfile({
//       displayName: `${firstName} ${lastName} (${studentNumber}) (${contactNumber})`
//     });
//     await db.collection("users").doc(user.uid).set({
//       firstName,
//       lastName,
//       studentNumber,
//       email,
//       contactNumber,
//       role,
//       viewedAnnouncement: false,
//     });
//     res.redirect("/login?status=register");
//   } catch (error) {
//     console.error(error);
//     res.redirect("/register?status=error");
//   }
// });

app.post("/users", async (req, res) => {
  const { email, password, firstName, lastName, studentNumber, contactNumber, role } = req.body;
  try {
    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    await user.updateProfile({
      displayName: `${firstName} ${lastName} (${studentNumber}) (${contactNumber})`
    });
    await db.collection("users").doc(user.uid).set({
      firstName,
      lastName,
      studentNumber,
      email,
      contactNumber,
      role,
    });
    res.redirect("/admin-users?status=register");
  } catch (error) {
    console.error(error);
    res.redirect("/admin-users?status=error");
  }
  
});

// LOGOUT
app.get("/logout", (req, res) => {
  firebase.auth().signOut().then(() => {
    req.session.destroy();
    res.redirect("/login");
  }).catch(error => {
    console.error('Error during logout:', error);
      res.status(500).send('Logout failed');;
  });
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});