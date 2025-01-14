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

// Authentication handlers
async function handleTeacherLogin() {
  const email = document.getElementById('teacher-email').value;
  const password = document.getElementById('teacher-password').value;
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userRef = ref(database, `users/${userCredential.user.uid}`);
    
    onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData && userData.role === 'teacher') {
        showNotification('Teacher login successful!');
        // Redirect to the teacher dashboard page
        window.location.href = 'teacher-dashboard.html'; // Update this to the actual page URL
      } else {
        signOut(auth);
        showNotification('Access denied: Not a teacher account', 'error');
      }
    }, {
      onlyOnce: true
    });
  } catch (error) {
    console.error('Login error:', error);
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
    }, {
      onlyOnce: true
    });
  } catch (error) {
    console.error('Login error:', error);
    showNotification(`Login failed: ${error.message}`, 'error');
  }
}

// Updated registration handlers with better error handling
async function registerTeacher() {
  try {
    const email = document.getElementById('new-teacher-email').value;
    const password = document.getElementById('new-teacher-password').value;
    const confirmPassword = document.getElementById('new-teacher-password-confirm').value;

    if (!email || !password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    try {
      await set(ref(database, `users/${userId}`), {
        email,
        role: 'teacher',
        createdAt: Date.now()
      });
      showNotification('Teacher registration successful!');
    } catch (dbError) {
      console.error('Database write error:', dbError);
      showNotification('Account created but profile setup failed. Please contact support.', 'error');
    }
  } catch (authError) {
    console.error('Authentication error:', authError);
    showNotification(`Registration failed: ${authError.message}`, 'error');
  }
}

async function registerStudent() {
  try {
    const email = document.getElementById('new-student-email').value;
    const password = document.getElementById('new-student-password').value;
    const confirmPassword = document.getElementById('new-student-password-confirm').value;

    if (!email || !password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    try {
      await set(ref(database, `users/${userId}`), {
        email,
        role: 'student',
        createdAt: Date.now()
      });
      showNotification('Student registration successful!');
    } catch (dbError) {
      console.error('Database write error:', dbError);
      showNotification('Account created but profile setup failed. Please contact support.', 'error');
    }
  } catch (authError) {
    console.error('Authentication error:', authError);
    showNotification(`Registration failed: ${authError.message}`, 'error');
  }
}

// Toggle form visibility functions
function showTeacherRegistration() {
  document.getElementById('teacher-register-form').classList.remove('hidden');
  document.getElementById('student-register-form').classList.add('hidden');
}

function showStudentRegistration() {
  document.getElementById('student-register-form').classList.remove('hidden');
  document.getElementById('teacher-register-form').classList.add('hidden');
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
    console.error('Join class error:', error);
    showNotification(`Failed to join class: ${error.message}`, 'error');
  }
}

async function setUserRole(email, role) {
  try {
    // Get the current user
    const user = auth.currentUser;
    if (!user) {
      const userCredential = await signInWithEmailAndPassword(auth, email, prompt("Enter your password"));
      user = userCredential.user;
    }
    
    // Set the role in the database
    await set(ref(database, `users/${user.uid}`), {
      email: user.email,
      role: role,
      createdAt: Date.now()
    });
    
    console.log("Role set successfully");
    showNotification("Account role updated successfully!");
  } catch (error) {
    console.error("Error setting role:", error);
    showNotification("Error updating role: " + error.message, "error");
  }
}


async function logoutUser() {
  try {
    await signOut(auth);
    showNotification('Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    showNotification(`Logout failed: ${error.message}`, 'error');
  }
}

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User logged in:', user.email);
  } else {
    console.log('No user logged in');
  }
});

// Export functions to window object
window.handleTeacherLogin = handleTeacherLogin;
window.handleStudentLogin = handleStudentLogin;
window.registerTeacher = registerTeacher;
window.registerStudent = registerStudent;
window.showTeacherRegistration = showTeacherRegistration;
window.showStudentRegistration = showStudentRegistration;
// Add this to your window exports
window.setUserRole = setUserRole;
window.logoutUser = logoutUser;
