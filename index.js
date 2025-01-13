// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Firebase configuration - replace with your config
const firebaseConfig = {
    apiKey: "AIzaSyA2uGeI_th2X_ir09-DTc1UdutM8jD8PcM",
    authDomain: "veet-84209.firebaseapp.com",
    projectId: "veet-84209",
    databaseUrl: "https://veet-84209-default-rtdb.europe-west1.firebasedatabase.app/",
    storageBucket: "veet-84209.firebasestorage.app",
    messagingSenderId: "31166385876",
    appId: "1:31166385876:web:2af1531652e2e0669af541",
    measurementId: "G-T7E9KHT1L2"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Application state management
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
async function registerTeacher(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save teacher data in the database
        await set(ref(db, `users/${user.uid}`), {
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

async function registerStudent(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await set(ref(db, `users/${user.uid}`), {
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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user's role and data
        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        const userData = userSnapshot.val();
        
        appData.currentUser = {
            uid: user.uid,
            email: user.email,
            role: userData.role
        };

        // Show appropriate screen based on role
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
        await signOut(auth);
        appData.currentUser = null;
        appData.currentClassCode = null;
        
        // Reset UI to login screen
        document.getElementById('room-creation').classList.add('hidden');
        document.getElementById('classroom-section').classList.add('hidden');
        document.getElementById('login-sections').classList.remove('hidden');
        
        showNotification('Logged out successfully');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Classroom Management Functions
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
        await set(ref(db, `classes/${classCode}`), classData);
        
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

async function joinClass(classCode) {
    if (!appData.currentUser || appData.currentUser.role !== 'student') {
        showNotification('Please login as a student first', 'error');
        return;
    }

    try {
        const classSnapshot = await get(ref(db, `classes/${classCode}`));
        
        if (!classSnapshot.exists()) {
            showNotification('Invalid class code!', 'error');
            return;
        }

        // Add student to class
        await update(ref(db, `classes/${classCode}/students`), {
            [appData.currentUser.uid]: {
                email: appData.currentUser.email,
                joined: new Date().toISOString(),
                active: true
            }
        });

        appData.currentClassCode = classCode;
        appData.classes[classCode] = classSnapshot.val();

        // Update UI
        document.getElementById('login-sections').classList.add('hidden');
        document.getElementById('classroom-section').classList.remove('hidden');
        document.getElementById('current-class-code').textContent = classCode;

        showNotification('Successfully joined the class');
        updateDashboard();
        loadResources();
    } catch (error) {
        showNotification('Error joining class: ' + error.message, 'error');
    }
}

// Resource Management Functions
async function uploadResource() {
    if (!appData.currentUser || !appData.currentClassCode) {
        showNotification('Please login and join a class first', 'error');
        return;
    }

    const file = document.getElementById('file-upload').files[0];
    const category = document.getElementById('resource-category').value;
    const deadline = document.getElementById('deadline').value;

    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }

    const resource = {
        name: file.name,
        type: file.type,
        category: category,
        deadline: deadline || null,
        uploadedBy: appData.currentUser.email,
        uploaderUid: appData.currentUser.uid,
        classCode: appData.currentClassCode,
        timestamp: new Date().toISOString(),
        size: file.size,
        lastModified: file.lastModified
    };

    const resourceId = Math.random().toString(36).substring(7);
    
    try {
        await set(ref(db, `resources/${resourceId}`), resource);
        await update(ref(db, `classes/${appData.currentClassCode}/resources`), {
            [resourceId]: true
        });
        
        appData.resources[resourceId] = resource;
        showNotification('Resource uploaded successfully');
        updateDashboard();
        loadResources();
    } catch (error) {
        showNotification('Error uploading resource: ' + error.message, 'error');
    }
}

// UI Update Functions
async function updateDashboard() {
    const activeStudents = document.getElementById('active-students');
    try {
        const classSnapshot = await get(ref(db, `classes/${appData.currentClassCode}`));
        if (classSnapshot.exists()) {
            const currentClass = classSnapshot.val();
            const studentCount = Object.keys(currentClass.students || {}).length;
            activeStudents.innerHTML = `<p>${studentCount} students enrolled</p>`;
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

async function loadResources() {
    const container = document.getElementById('resources-container');
    container.innerHTML = '';

    try {
        const resourcesSnapshot = await get(ref(db, `resources`));
        if (!resourcesSnapshot.exists()) return;

        const resources = resourcesSnapshot.val();
        Object.entries(resources)
            .filter(([_, resource]) => resource.classCode === appData.currentClassCode)
            .forEach(([id, resource]) => {
                const card = document.createElement('div');
                card.className = 'resource-card glass';
                card.innerHTML = `
                    <h3>${resource.name}</h3>
                    <p>Category: ${resource.category}</p>
                    <p>Uploaded by: ${resource.uploadedBy}</p>
                    ${
                        resource.deadline
                            ? `<p class="deadline">Due: ${new Date(resource.deadline).toLocaleDateString()}</p>`
                            : ''
                    }
                    <button class="btn" onclick="downloadResource('${id}')">Download</button>
                `;
                container.appendChild(card);
            });
    } catch (error) {
        console.error('Error loading resources:', error);
        showNotification('Error loading resources', 'error');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize app when page loads
async function initializeApp() {
    try {
        // Check for existing auth session
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userSnapshot = await get(ref(db, `users/${user.uid}`));
                const userData = userSnapshot.val();
                appData.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    role: userData.role
                };
                
                // Load classes and resources
                const classesSnapshot = await get(ref(db, 'classes'));
                if (classesSnapshot.exists()) {
                    appData.classes = classesSnapshot.val();
                }

                const resourcesSnapshot = await get(ref(db, 'resources'));
                if (resourcesSnapshot.exists()) {
                    appData.resources = resourcesSnapshot.val();
                }
            }
        });
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error loading data', 'error');
    }
}

// Export functions for global access
window.registerTeacher = registerTeacher;
window.registerStudent = registerStudent;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.createNewClass = createNewClass;
window.joinClass = joinClass;
window.uploadResource = uploadResource;
window.downloadResource = downloadResource;

// Initialize when page loads
window.addEventListener('load', initializeApp);
