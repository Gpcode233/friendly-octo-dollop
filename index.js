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

console.log("Firebase initialized successfully!");

// Utility functions
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

// Authentication handlers
async function handleTeacherLogin() {
  const email = document.getElementById("teacher-email").value;
  const password = document.getElementById("teacher-password").value;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Teacher logged in:", userCredential.user);
    showNotification("Login successful!");
  } catch (error) {
    console.error("Error during login:", error.message);
    showNotification("Login failed: " + error.message, "error");
  }
}

async function handleStudentLogin() {
  const email = document.getElementById("student-email").value;
  const password = document.getElementById("student-password").value;
  const classCode = document.getElementById("class-code").value;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Student logged in:", userCredential.user);
    if (classCode) {
      await joinClass(classCode);
    }
    showNotification("Login successful!");
  } catch (error) {
    console.error("Error during login:", error.message);
    showNotification("Login failed: " + error.message, "error");
  }
}

async function registerTeacher(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    await set(ref(database, `users/${userId}`), {
      email,
      role: "teacher",
      createdAt: Date.now()
    });
    showNotification("Teacher registration successful!");
  } catch (error) {
    console.error("Error during teacher registration:", error.message);
    showNotification("Registration failed: " + error.message, "error");
  }
}

async function registerStudent(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    await set(ref(database, `users/${userId}`), {
      email,
      role: "student",
      createdAt: Date.now()
    });
    showNotification("Student registration successful!");
  } catch (error) {
    console.error("Error during student registration:", error.message);
    showNotification("Registration failed: " + error.message, "error");
  }
}

async function logoutUser() {
  try {
    await signOut(auth);
    showNotification("Logout successful!");
  } catch (error) {
    console.error("Error during logout:", error.message);
    showNotification("Logout failed: " + error.message, "error");
  }
}

async function joinClass(classCode) {
  try {
    const classRef = ref(database, `classes/${classCode}`);
    const snapshot = await push(classRef, {
      userId: auth.currentUser.uid,
      joinedAt: Date.now()
    });
    console.log("Joined class successfully:", snapshot.key);
    showNotification("Joined class successfully!");
  } catch (error) {
    console.error("Error joining class:", error.message);
    showNotification("Failed to join class: " + error.message, "error");
  }
}

function showTeacherRegistration() {
  document.getElementById("teacher-register-form").classList.remove("hidden");
  document.getElementById("student-register-form").classList.add("hidden");
}

function showStudentRegistration() {
  document.getElementById("student-register-form").classList.remove("hidden");
  document.getElementById("teacher-register-form").classList.add("hidden");
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.email);
  } else {
    console.log("No user is logged in.");
  }
});

// Expose functions globally
window.handleTeacherLogin = handleTeacherLogin;
window.handleStudentLogin = handleStudentLogin;
window.registerTeacher = registerTeacher;
window.registerStudent = registerStudent;
window.logoutUser = logoutUser;
window.showTeacherRegistration = showTeacherRegistration;
window.showStudentRegistration = showStudentRegistration;
