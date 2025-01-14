// Import the required Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2uGeI_th2X_ir09-DTc1UdutM8jD8PcM",
  authDomain: "veet-84209.firebaseapp.com",
  databaseURL: "https://veet-84209-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "veet-84209",
  storageBucket: "veet-84209.appspot.com",
  messagingSenderId: "31166385876",
  appId: "1:31166385876:web:2af1531652e2e0669af541",
  measurementId: "G-T7E9KHT1L2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// UI Initialization function
function initializeUI() {
  const teacherRegBtn = document.querySelector('button[onclick="showTeacherRegistration()"]');
  const studentRegBtn = document.querySelector('button[onclick="showStudentRegistration()"]');
  const teacherLoginBtn = document.querySelector('button[onclick="handleTeacherLogin()"]');
  const studentLoginBtn = document.querySelector('button[onclick="handleStudentLogin()"]');

  if (teacherRegBtn) teacherRegBtn.addEventListener('click', showTeacherRegistration);
  if (studentRegBtn) studentRegBtn.addEventListener('click', showStudentRegistration);
  if (teacherLoginBtn) teacherLoginBtn.addEventListener('click', handleTeacherLogin);
  if (studentLoginBtn) studentLoginBtn.addEventListener('click', handleStudentLogin);
}

// Handle authentication state changes
function handleAuthStateChange(user) {
  if (user) {
    const userRef = ref(database, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      console.log("Authenticated user:", userData);
    });
  } else {
    showLoginForm();
  }
}

// Show the login form
function showLoginForm() {
  const loginSections = document.getElementById('login-sections');
  if (loginSections) loginSections.classList.remove('hidden');

  const teacherRegForm = document.getElementById('teacher-register-form');
  if (teacherRegForm) teacherRegForm.classList.add('hidden');

  const studentRegForm = document.getElementById('student-register-form');
  if (studentRegForm) studentRegForm.classList.add('hidden');
}

// Show the teacher registration form
function showTeacherRegistration() {
  const loginSections = document.getElementById('login-sections');
  const teacherRegForm = document.getElementById('teacher-register-form');

  if (loginSections) loginSections.classList.add('hidden');
  if (teacherRegForm) teacherRegForm.classList.remove('hidden');
}

// Show the student registration form
function showStudentRegistration() {
  const loginSections = document.getElementById('login-sections');
  const studentRegForm = document.getElementById('student-register-form');

  if (loginSections) loginSections.classList.add('hidden');
  if (studentRegForm) studentRegForm.classList.remove('hidden');
}

// Show a notification
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Attach auth state listener
onAuthStateChanged(auth, handleAuthStateChange);

// DOM Event Listeners
document.addEventListener('DOMContentLoaded', initializeUI);
document.getElementById("logoutButton").addEventListener("click", handleLogout);

// Expose functions to the global scope for external access
window.handleTeacherLogin = handleTeacherLogin;
window.handleStudentLogin = handleStudentLogin;
window.registerTeacher = registerTeacher;
window.registerStudent = registerStudent;
window.loginUser = handleLogin;
window.logoutUser = handleLogout;
window.joinClass = joinClass;
window.showTeacherRegistration = showTeacherRegistration;
window.showStudentRegistration = showStudentRegistration;
