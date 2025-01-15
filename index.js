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
    onValue,
    get 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";

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
const storage = getStorage(app);

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
                showTeacherDashboard();
                loadTeacherClasses();
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
                showStudentDashboard();
                loadStudentClasses(userCredential.user.uid);
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
// Modify joinClass function
async function joinClass(classCode, userId) {
    if (!classCode || !userId) {
        showNotification('Invalid class code or user ID', 'error');
        return;
    }

    try {
        const classRef = ref(database, `classes/${classCode}`);
        const classSnapshot = await get(classRef);
        
        if (!classSnapshot.exists()) {
            showNotification('Invalid class code', 'error');
            return;
        }

        // Add student to class
        await set(ref(database, `classes/${classCode}/students/${userId}`), {
            joinedAt: Date.now()
        });

        // Add class to student's enrolled classes
        await set(ref(database, `users/${userId}/enrolledClasses/${classCode}`), true);

        showNotification('Successfully joined class!');
        loadStudentClasses(userId);
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

// Add function to load student's classes
async function loadStudentClasses(userId) {
    const studentClassesRef = ref(database, `users/${userId}/enrolledClasses`);
    const studentClassesList = document.getElementById('student-classes-list');
    studentClassesList.innerHTML = '';

    onValue(studentClassesRef, (snapshot) => {
        const enrolledClasses = snapshot.val();
        
        if (!enrolledClasses) {
            studentClassesList.innerHTML = '<p>You are not enrolled in any classes yet</p>';
            return;
        }

        Object.keys(enrolledClasses).forEach(classCode => {
            const classRef = ref(database, `classes/${classCode}`);
            
            onValue(classRef, (classSnapshot) => {
                const classData = classSnapshot.val();
                if (classData) {
                    const classElement = document.createElement('div');
                    classElement.className = 'class-card';
                    classElement.innerHTML = `
                        <h3>${classData.name}</h3>
                        <p>Subject: ${classData.subject}</p>
                        <button class="btn" onclick="handleViewClass('${classCode}')">View Class</button>
                    `;
                    studentClassesList.appendChild(classElement);
                }
            }, { onlyOnce: true });
        });
    });
}

// Add these new functions for dashboard management
function showTeacherDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('teacher-dashboard').classList.remove('hidden');
    document.getElementById('student-dashboard').classList.add('hidden');
}

function showStudentDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('teacher-dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.remove('hidden');
}

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('teacher-dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.add('hidden');
}

// Generate a random 6-character class code
function generateClassCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Create a new class
async function createClass() {
    const user = auth.currentUser;
    if (!user) {
        showNotification('Please log in first', 'error');
        return;
    }

    const className = document.getElementById('class-name').value;
    const subject = document.getElementById('subject').value;

    if (!className || !subject) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        const classCode = generateClassCode();
        const classData = {
            name: className,
            subject: subject,
            teacherId: user.uid,
            teacherEmail: user.email,
            createdAt: Date.now(),
            classCode: classCode
        };

        // Save class data
        await set(ref(database, `classes/${classCode}`), classData);
        
        // Add class reference to teacher's classes
        const teacherClassRef = ref(database, `users/${user.uid}/classes/${classCode}`);
        await set(teacherClassRef, true);

        showNotification('Class created successfully!');
        document.getElementById('class-name').value = '';
        document.getElementById('subject').value = '';
        
        loadTeacherClasses();
    } catch (error) {
        console.error('Error creating class:', error);
        showNotification(`Failed to create class: ${error.message}`, 'error');
    }
}

// Load teacher's classes
async function loadTeacherClasses() {
    const user = auth.currentUser;
    if (!user) return;

    const classesList = document.getElementById('classes-list');
    classesList.innerHTML = '';

    const teacherClassesRef = ref(database, `users/${user.uid}/classes`);
    
    onValue(teacherClassesRef, (snapshot) => {
        const classesData = snapshot.val();
        classesList.innerHTML = ''; // Clear list before adding classes
        
        if (!classesData) {
            classesList.innerHTML = '<p>No classes created yet</p>';
            return;
        }

        // Use a Set to track unique class codes
        const processedClasses = new Set();

        Object.keys(classesData).forEach(classCode => {
            if (!processedClasses.has(classCode)) {
                processedClasses.add(classCode);
                const classRef = ref(database, `classes/${classCode}`);
                
                onValue(classRef, (classSnapshot) => {
                    const classData = classSnapshot.val();
                    if (classData) {
                        const classElement = document.createElement('div');
                        classElement.className = 'class-card';
                        classElement.innerHTML = `
                            <h3>${classData.name}</h3>
                            <p>Subject: ${classData.subject}</p>
                            <p>Class Code: <span class="class-code">${classData.classCode}</span></p>
                            <button class="btn" onclick="handleViewClass('${classData.classCode}')">View Class</button>
                        `;
                        classesList.appendChild(classElement);
                    }
                }, { onlyOnce: true });
            }
        });
    });
}

// Add class viewing functionality
async function handleViewClass(classCode) {
    const classRef = ref(database, `classes/${classCode}`);
    const studentsRef = ref(database, `classes/${classCode}/students`);
    const assignmentsRef = ref(database, `classes/${classCode}/assignments`);
    
    try {
        const [classSnapshot, studentsSnapshot, assignmentsSnapshot] = await Promise.all([
            get(classRef),
            get(studentsRef),
            get(assignmentsRef)
        ]);

        const classData = classSnapshot.val();
        const studentsData = studentsSnapshot.val();
        const assignmentsData = assignmentsSnapshot.val();
        const studentCount = studentsData ? Object.keys(studentsData).length : 0;

        // Hide the classes list and show the class view
        document.getElementById('classes-list').classList.add('hidden');
        
        // Create and show class view
        const classView = document.createElement('div');
        classView.id = 'class-view';
        classView.className = 'class-view glass';
        classView.innerHTML = `
            <button class="btn back-button" onclick="backToClasses()">← Back to Classes</button>
            <h2>${classData.name}</h2>
            <p>Subject: ${classData.subject}</p>
            <p>Students Enrolled: ${studentCount}</p>
            <div class="assignments-section">
                <h3>Assignments</h3>
                <div class="upload-assignment">
                    <input type="file" 
                           id="assignment-file" 
                           accept=".pdf,.doc,.docx,.txt" 
                           style="display: none;">
                    <button class="btn" onclick="document.getElementById('assignment-file').click()">
                        Choose File
                    </button>
                    <span id="selected-file-name">No file chosen</span>
                    <button class="btn" onclick="uploadAssignment('${classCode}')">
                        Upload
                    </button>
                </div>
                <div id="assignments-list" class="assignments-list">
                    ${renderAssignments(assignmentsData)}
                </div>
            </div>
        `;
        
        document.querySelector('.classes-section').appendChild(classView);

        // Add file input change listener to update the display text
        const fileInput = classView.querySelector('#assignment-file');
        const fileNameDisplay = classView.querySelector('#selected-file-name');
        
        fileInput.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || 'No file chosen';
            fileNameDisplay.textContent = fileName;
        });

    } catch (error) {
        console.error('Error viewing class:', error);
        showNotification('Error loading class details', 'error');
    }
}

// Add function to render assignments
function renderAssignments(assignments) {
    if (!assignments) {
        return '<p>No assignments uploaded yet</p>';
    }

    return Object.entries(assignments).map(([id, assignment]) => `
        <div class="assignment-item">
            <span class="assignment-name">${assignment.fileName}</span>
            <div class="assignment-actions">
                <button class="btn download-btn" onclick="downloadAssignment('${assignment.downloadURL}', '${assignment.fileName}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        </div>
    `).join('');
}

// Add upload assignment functionality
async function uploadAssignment(classCode) {
    const fileInput = document.getElementById('assignment-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a file first', 'error');
        return;
    }

    try {
        showNotification('Uploading assignment...', 'success');
        
        // Create a storage reference
        const fileStorageRef = storageRef(storage, `assignments/${classCode}/${file.name}`);
        
        // Upload file
        const snapshot = await uploadBytes(fileStorageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Save assignment metadata to database
        const assignmentRef = ref(database, `classes/${classCode}/assignments`);
        const newAssignmentRef = push(assignmentRef);
        
        await set(newAssignmentRef, {
            fileName: file.name,
            downloadURL: downloadURL,
            uploadedAt: Date.now(),
            uploadedBy: auth.currentUser.uid
        });

        showNotification('Assignment uploaded successfully!');
        
        // Refresh assignments list
        const assignmentsSnapshot = await get(assignmentRef);
        const assignmentsDiv = document.getElementById('assignments-list');
        assignmentsDiv.innerHTML = renderAssignments(assignmentsSnapshot.val());
        
        // Clear file input
        fileInput.value = '';
    } catch (error) {
        console.error('Error uploading assignment:', error);
        showNotification('Failed to upload assignment: ' + error.message, 'error');
    }
}

// Add download assignment functionality
async function downloadAssignment(downloadURL, fileName) {
    try {
        const response = await fetch(downloadURL);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading assignment:', error);
        showNotification('Failed to download assignment', 'error');
    }
}

// Add back to classes functionality
function backToClasses() {
    const classView = document.getElementById('class-view');
    if (classView) {
        classView.remove();
    }
    document.getElementById('classes-list').classList.remove('hidden');
}

async function logoutUser() {
    try {
        await signOut(auth);
        showAuthSection();
        showNotification('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification(`Logout failed: ${error.message}`, 'error');
    }
}


// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                if (userData.role === 'teacher') {
                    showTeacherDashboard();
                    loadTeacherClasses();
                } else if (userData.role === 'student') {
                    showStudentDashboard();
                    // Load student classes (implement this function)
                }
            }
        });
    } else {
        showAuthSection();
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
window.createClass = createClass;
// Add to window exports
window.handleViewClass = handleViewClass;
window.backToClasses = backToClasses;
// Add to window exports
window.uploadAssignment = uploadAssignment;
window.downloadAssignment = downloadAssignment;
window.logoutUser = logoutUser;
