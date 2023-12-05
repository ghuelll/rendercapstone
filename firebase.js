const firebase = require('firebase/compat/app');
const firebaseConfig = {
    apiKey: "AIzaSyAHVnMby_ueh9o5T3aHWxZB_yabU4goy04",
    authDomain: "capstonetip.firebaseapp.com",
    projectId: "capstonetip",
    storageBucket: "capstonetip.appspot.com",
    messagingSenderId: "102590705228",
    appId: "1:102590705228:web:5a4255ece24374d1bb0ee9",
    measurementId: "G-D99V26THVE"
  };

firebase.initializeApp(firebaseConfig);

module.exports = firebase;