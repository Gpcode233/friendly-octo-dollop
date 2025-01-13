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

function handleTeacherLogin() {
    const email = document.getElementById('teacher-email').value;
    const password = document.getElementById('teacher-password').value;
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    loginUser(email, password, 'teacher');
}

function handleStudentLogin() {
    const email = document.getElementById('student-email').value;
    const password = document.getElementById('student-password').value;
    const classCode = document.getElementById('class-code').value;
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    loginUser(email, password, 'student', classCode);
}



// UI Helper Functions
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function showTeacherRegistration() {
    document.getElementById('login-sections').classList.add('hidden');
    document.getElementById('teacher-register-form').classList.remove('hidden');
}

function showStudentRegistration() {
    document.getElementById('login-sections').classList.add('hidden');
    document.getElementById('student-register-form').classList.remove('hidden');
}

// Authentication Functions
async function registerTeacher() {
    const email = document.getElementById('new-teacher-email').value;
    const password = document.getElementById('new-teacher-password').value;
    const confirmPassword = document.getElementById('new-teacher-password-confirm').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await db.ref(`users/${user.uid}`).set({
            email: email,
            role: 'teacher',
            createdAt: new Date().toISOString()
        });

        showNotification('Teacher registration successful');
        document.getElementById('teacher-register-form').classList.add('hidden');
        document.getElementById('login-sections').classList.remove('hidden');
        return user;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
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
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await db.ref(`users/${user.uid}`).set({
            email: email,
            role: 'student',
            createdAt: new Date().toISOString()
        });

        showNotification('Student registration successful');
        document.getElementById('student-register-form').classList.add('hidden');
        document.getElementById('login-sections').classList.remove('hidden');
        return user;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    }
}

// Add the missing functions
async function joinClass(classCode) {
    if (!appData.currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    try {
        const classRef = await db.ref(`classes/${classCode}`).get();
        if (!classRef.exists()) {
            showNotification('Invalid class code', 'error');
            return;
        }

        await db.ref(`classes/${classCode}/students/${appData.currentUser.uid}`).set({
            email: appData.currentUser.email,
            joinedAt: new Date().toISOString()
        });

        showNotification('Successfully joined class');
        appData.currentClassCode = classCode;
        updateDashboard();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function uploadResource() {
    if (!appData.currentUser || !appData.currentClassCode) {
        showNotification('Please create or join a class first', 'error');
        return;
    }

    const fileInput = document.getElementById('file-upload');
    const category = document.getElementById('resource-category').value;
    const deadline = document.getElementById('deadline').value;

    if (!fileInput.files[0]) {
        showNotification('Please select a file', 'error');
        return;
    }

    // For now, just store the file name since we haven't set up Firebase Storage
    try {
        const resourceRef = db.ref(`classes/${appData.currentClassCode}/resources`).push();
        await resourceRef.set({
            name: fileInput.files[0].name,
            category: category,
            deadline: deadline || null,
            uploadedBy: appData.currentUser.email,
            uploadedAt: new Date().toISOString()
        });

        showNotification('Resource uploaded successfully');
        updateDashboard();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function downloadResource(resourceId) {
    // Implement when Firebase Storage is set up
    showNotification('Download functionality coming soon');
}

// Make functions available globally
window.handleTeacherLogin = handleTeacherLogin;
window.handleStudentLogin = handleStudentLogin;
window.showTeacherRegistration = showTeacherRegistration;
window.showStudentRegistration = showStudentRegistration;
window.registerTeacher = registerTeacher;
window.registerStudent = registerStudent;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.createNewClass = createNewClass;
window.joinClass = joinClass;
window.uploadResource = uploadResource;
window.downloadResource = downloadResource;

// Your existing initialization code...
window.addEventListener('load', () => {
    auth.onAuthStateChanged(async (user) => {
        // Your existing onAuthStateChanged logic...
    });
});
