// Firebase configuration
const firebaseConfig = {
    // Your existing config...
    apiKey: "AIzaSyA2uGeI_th2X_ir09-DTc1UdutM8jD8PcM",
    authDomain: "veet-84209.firebaseapp.com",
    projectId: "veet-84209",
    databaseUrl: "https://veet-84209-default-rtdb.europe-west1.firebasedatabase.app/",
    storageBucket: "veet-84209.firebasestorage.app",
    messagingSenderId: "31166385876",
    appId: "1:31166385876:web:2af1531652e2e0669af541",
    measurementId: "G-T7E9KHT1L2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Wait for DOM content to be loaded before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initializeUI();

    // Set up auth state listener
    auth.onAuthStateChanged(handleAuthStateChange);
});

// Application state
const appData = {
    classes: {},
    resources: {},
    currentUser: null,
    currentClassCode: null,
    messages: [],
    activities: [],
    theme: 'dark'
};

// UI Initialization
function initializeUI() {
    // Add event listeners for registration buttons
    const teacherRegBtn = document.querySelector('button[onclick="showTeacherRegistration()"]');
    if (teacherRegBtn) {
        teacherRegBtn.addEventListener('click', showTeacherRegistration);
    }

    const studentRegBtn = document.querySelector('button[onclick="showStudentRegistration()"]');
    if (studentRegBtn) {
        studentRegBtn.addEventListener('click', showStudentRegistration);
    }

    // Add event listeners for login buttons
    const teacherLoginBtn = document.querySelector('button[onclick="handleTeacherLogin()"]');
    if (teacherLoginBtn) {
        teacherLoginBtn.addEventListener('click', handleTeacherLogin);
    }

    const studentLoginBtn = document.querySelector('button[onclick="handleStudentLogin()"]');
    if (studentLoginBtn) {
        studentLoginBtn.addEventListener('click', handleStudentLogin);
    }
}

// Authentication state handler
function handleAuthStateChange(user) {
    if (user) {
        db.ref(`users/${user.uid}`).once('value').then((snapshot) => {
            const userData = snapshot.val();
            appData.currentUser = {
                uid: user.uid,
                email: user.email,
                role: userData.role
            };
            updateUIForRole(userData.role);
        });
    } else {
        appData.currentUser = null;
        showLoginForm();
    }
}

// UI State Functions
function showLoginForm() {
    const loginSections = document.getElementById('login-sections');
    if (loginSections) {
        loginSections.classList.remove('hidden');
    }
    
    const teacherRegForm = document.getElementById('teacher-register-form');
    if (teacherRegForm) {
        teacherRegForm.classList.add('hidden');
    }
    
    const studentRegForm = document.getElementById('student-register-form');
    if (studentRegForm) {
        studentRegForm.classList.add('hidden');
    }
}

function showTeacherRegistration() {
    const loginSections = document.getElementById('login-sections');
    const teacherRegForm = document.getElementById('teacher-register-form');
    
    if (loginSections && teacherRegForm) {
        loginSections.classList.add('hidden');
        teacherRegForm.classList.remove('hidden');
    }
}

function showStudentRegistration() {
    const loginSections = document.getElementById('login-sections');
    const studentRegForm = document.getElementById('student-register-form');
    
    if (loginSections && studentRegForm) {
        loginSections.classList.add('hidden');
        studentRegForm.classList.remove('hidden');
    }
}
// Notification
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

// Authentication Functions

// Authentication Functions
async function handleTeacherLogin() {
    const email = document.getElementById('teacher-email')?.value;
    const password = document.getElementById('teacher-password')?.value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    await loginUser(email, password, 'teacher');
}

async function handleStudentLogin() {
    const email = document.getElementById('student-email')?.value;
    const password = document.getElementById('student-password')?.value;
    const classCode = document.getElementById('class-code')?.value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    await loginUser(email, password, 'student', classCode);
}

async function registerTeacher(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await db.ref(`users/${userCredential.user.uid}`).set({
            email: email,
            role: 'teacher',
            createdAt: Date.now()
        });
        showNotification('Teacher registration successful');
        updateUIForRole('teacher');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function registerStudent(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await db.ref(`users/${userCredential.user.uid}`).set({
            email: email,
            role: 'student',
            createdAt: Date.now()
        });
        showNotification('Student registration successful');
        updateUIForRole('student');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loginUser(email, password, role, classCode = null) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user data from database
        const userSnapshot = await db.ref(`users/${user.uid}`).once('value');
        const userData = userSnapshot.val();
        
        if (!userData || userData.role !== role) {
            await auth.signOut();
            throw new Error(`Invalid ${role} credentials`);
        }

        // Store user data in app state
        appData.currentUser = {
            uid: user.uid,
            email: user.email,
            role: userData.role
        };

        updateUIForRole(role);
        if (role === 'student' && classCode) {
            await joinClass(classCode);
        }
        
        showNotification('Login successful');
    } catch (error) {
        showNotification(error.message, 'error');
        throw error; // Re-throw to handle in calling function
    }
}

async function logoutUser() {
    try {
        await auth.signOut();
        appData.currentUser = null;
        showLoginForm();
        showNotification('Logged out successfully');
    } catch (error) {
        showNotification('Error logging out: ' + error.message, 'error');
    }
}

async function joinClass(classCode) {
    try {
        const classRef = db.ref(`classes/${classCode}`);
        const classSnapshot = await classRef.once('value');
        
        if (!classSnapshot.exists()) {
            throw new Error('Invalid class code');
        }
        
        await classRef.child('students').child(appData.currentUser.uid).set({
            email: appData.currentUser.email,
            joinedAt: Date.now()
        });
        
        appData.currentClassCode = classCode;
        showNotification('Joined class successfully');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Update the window exports
window.handleTeacherLogin = handleTeacherLogin;
window.handleStudentLogin = handleStudentLogin;
window.showTeacherRegistration = showTeacherRegistration;
window.showStudentRegistration = showStudentRegistration;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.registerTeacher = registerTeacher;
window.registerStudent = registerStudent;
