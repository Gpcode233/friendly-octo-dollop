// Then modify your index.js to use the compat version:
// Firebase configuration
const firebaseConfig = {
    // Your config here
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

// Authentication Functions
async function registerTeacher() {
    const email = document.getElementById('new-teacher-email').value;
    const password = document.getElementById('new-teacher-password').value;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save teacher data
        await db.ref(`users/${user.uid}`).set({
            email: email,
            role: 'teacher',
            createdAt: new Date().toISOString()
        });

        showNotification('Teacher registration successful');
        return user;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    }
}

async function registerStudent() {
    const email = document.getElementById('new-student-email').value;
    const password = document.getElementById('new-student-password').value;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await db.ref(`users/${user.uid}`).set({
            email: email,
            role: 'student',
            createdAt: new Date().toISOString()
        });

        showNotification('Student registration successful');
        return user;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user's role and data
        const userSnapshot = await db.ref(`users/${user.uid}`).get();
        const userData = userSnapshot.val();
        
        appData.currentUser = {
            uid: user.uid,
            email: user.email,
            role: userData.role
        };

        if (userData.role === 'teacher') {
            document.getElementById('login-sections').classList.add('hidden');
            document.getElementById('room-creation').classList.remove('hidden');
            document.getElementById('teacher-name').textContent = email;
        }
        
        showNotification('Login successful');
        return user;
    } catch (error) {
        showNotification(error.message, 'error');
        throw error;
    }
}

async function logoutUser() {
    try {
        await auth.signOut();
        appData.currentUser = null;
        appData.currentClassCode = null;
        
        document.getElementById('room-creation').classList.add('hidden');
        document.getElementById('classroom-section').classList.add('hidden');
        document.getElementById('login-sections').classList.remove('hidden');
        
        showNotification('Logged out successfully');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Rest of your functions, modified to use firebase.database() instead of getDatabase()
// Example:
async function createNewClass() {
    if (!appData.currentUser || appData.currentUser.role !== 'teacher') {
        showNotification('Only teachers can create classes', 'error');
        return;
    }

    const classCode = Math.random().toString(36).substring(7).toUpperCase();
    const classData = {
        teacher: appData.currentUser.email,
        teacherUid: appData.currentUser.uid,
        students: {},
        resources: {},
        createdAt: new Date().toISOString()
    };
    
    try {
        await db.ref(`classes/${classCode}`).set(classData);
        
        appData.classes[classCode] = classData;
        appData.currentClassCode = classCode;

        document.getElementById('room-creation').classList.add('hidden');
        document.getElementById('classroom-section').classList.remove('hidden');
        document.getElementById('current-class-code').textContent = classCode;

        showNotification(`New classroom created! Code: ${classCode}`);
        updateDashboard();
    } catch (error) {
        showNotification('Error creating classroom: ' + error.message, 'error');
    }
}

// Make sure all functions are available in the global scope
window.registerTeacher = registerTeacher;
window.registerStudent = registerStudent;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.createNewClass = createNewClass;
window.joinClass = joinClass;
window.uploadResource = uploadResource;
window.downloadResource = downloadResource;

// Initialize when page loads
window.addEventListener('load', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userSnapshot = await db.ref(`users/${user.uid}`).get();
            const userData = userSnapshot.val();
            appData.currentUser = {
                uid: user.uid,
                email: user.email,
                role: userData.role
            };
            
            const classesSnapshot = await db.ref('classes').get();
            if (classesSnapshot.exists()) {
                appData.classes = classesSnapshot.val();
            }

            const resourcesSnapshot = await db.ref('resources').get();
            if (resourcesSnapshot.exists()) {
                appData.resources = resourcesSnapshot.val();
            }
        }
    });
});
