// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

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

// Toggle visibility functions
function toggleForm(formToShow, formToHide) {
  document.getElementById(formToShow).classList.remove('hidden');
  document.getElementById(formToHide).classList.add('hidden');
}

// Registration form display functions
function showTeacherRegistration() {
  toggleForm('teacher-register-form', 'student-register-form');
}

function showStudentRegistration() {
  toggleForm('student-register-form', 'teacher-register-form');
}

// Authentication handlers
async function handleTeacherLogin() {
  const email = document.getElementById('teacher-email').value;
  const password = document.getElementById('teacher-password').value;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userRef = ref(database, `users/${userCredential.user.uid}`);
    
    // Verify if user is a teacher
    onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData && userData.role === 'teacher') {
        showNotification('Teacher login successful!');
        // Add your teacher dashboard redirect logic here
      } else {
        signOut(auth);
        showNotification('Access denied: Not a teacher account', 'error');
      }
    });
  } catch (error) {
    showNotification(`Login failed: ${error.message}`, 'error');
  }
}

async function handleStudentLogin() {
  const email = document.getElementById('student-email').value;
  const password = document.getElementById('student-password').value;
  const classCode = document.getElementById('class-code').value;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userRef = ref(database, `users/${userCredential.user.uid}`);
    
    onValue(userRef, async (snapshot) => {
      const userData = snapshot.val();
      if (userData && userData.role === 'student') {
        if (classCode) {
          await joinClass(classCode, userCredential.user.uid);
        }
        showNotification('Student login successful!');
        // Add your student dashboard redirect logic here
      } else {
        signOut(auth);
        showNotification('Access denied: Not a student account', 'error');
      }
    });
  } catch (error) {
    showNotification(`Login failed: ${error.message}`, 'error');
  }
}

// Registration handlers
async function registerTeacher() {
  const email = document.getElementById('new-teacher-email').value;
  const password = document.getElementById('new-teacher-password').value;
  const confirmPassword = document.getElementById('new-teacher-password-confirm').value;

  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(database, `users/${userCredential.user.uid}`), {
      email,
      role: 'teacher',
      createdAt: Date.now()
    });
    showNotification('Teacher registration successful!');
  } catch (error) {
    showNotification(`Registration failed: ${error.message}`, 'error');
  }
}

async function registerStudent() {
  const email = document.getElementById('new-student-email').value;
  const password = document.getElementById('new-student-password').value;
  const confirmPassword = document.getElementById('new-student-password-confirm').value;

  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(database, `users/${userCredential.user.uid}`), {
      email,
      role: 'student',
      createdAt: Date.now()
    });
    showNotification('Student registration successful!');
  } catch (error) {
    showNotification(`Registration failed: ${error.message}`, 'error');
  }
}

// Class management
async function joinClass(classCode, userId) {
  if (!classCode || !userId) {
    showNotification('Invalid class code or user ID', 'error');
    return;
  }

  try {
    const classRef = ref(database, `classes/${classCode}/students`);
    await push(classRef, {
      userId,
      joinedAt: Date.now()
    });
    showNotification('Successfully joined class!');
  } catch (error) {
    showNotification(`Failed to join class: ${error.message}`, 'error');
  }
}

async function logoutUser() {
  try {
    await signOut(auth);
    showNotification('Logged out successfully');
    // Add your logout redirect logic here
  } catch (error) {
    showNotification(`Logout failed: ${error.message}`, 'error');
  }
}

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User logged in:', user.email);
    // Add your post-login UI update logic here
  } else {
    console.log('No user logged in');
    // Add your post-logout UI update logic here
  }
});

// Export functions to window object for HTML access
window.handleTeacherLogin = handleTeacherLogin;
window.handleStudentLogin = handleStudentLogin;
window.registerTeacher = registerTeacher;
window.registerStudent = registerStudent;
window.showTeacherRegistration = showTeacherRegistration;
window.showStudentRegistration = showStudentRegistration;
window.logoutUser = logoutUser;
