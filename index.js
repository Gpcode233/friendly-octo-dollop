// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    push, 
    onValue,
    get 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

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
  const notificationText = notification.querySelector('.notification-text');
  const notificationIcon = notification.querySelector('.notification-icon');
  
  if (notification && notificationText) {
    notificationText.textContent = message;
    notification.className = `notification show ${type}`;
    
    // Update icon based on type
    if (type === 'success') {
      notificationIcon.className = 'fas fa-check-circle notification-icon';
    } else if (type === 'error') {
      notificationIcon.className = 'fas fa-exclamation-circle notification-icon';
    } else if (type === 'warning') {
      notificationIcon.className = 'fas fa-exclamation-triangle notification-icon';
    } else {
      notificationIcon.className = 'fas fa-info-circle notification-icon';
    }
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 4000);
  }
}

function showLoading(show = true) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    if (show) {
      spinner.classList.remove('hidden');
    } else {
      spinner.classList.add('hidden');
    }
  }
}

// Authentication handlers
async function handleTeacherLogin() {
    const email = document.getElementById('teacher-email').value.trim();
    const password = document.getElementById('teacher-password').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userRef = ref(database, `users/${userCredential.user.uid}`);
        
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.role === 'teacher') {
                showNotification('Welcome back, Teacher! 🎓');
                showTeacherDashboard();
                loadTeacherClasses();
            } else {
                signOut(auth);
                showNotification('Access denied: Not a teacher account', 'error');
            }
            showLoading(false);
        }, {
            onlyOnce: true
        });
    } catch (error) {
        console.error('Login error:', error);
        showNotification(`Login failed: ${error.message}`, 'error');
        showLoading(false);
    }
}

async function handleStudentLogin() {
    const email = document.getElementById('student-email').value.trim();
    const password = document.getElementById('student-password').value;
    const classCode = document.getElementById('class-code').value.trim().toUpperCase();
    
    if (!email || !password) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userRef = ref(database, `users/${userCredential.user.uid}`);
        
        onValue(userRef, async (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData.role === 'student') {
                if (classCode) {
                    await joinClass(classCode, userCredential.user.uid);
                }
                showNotification('Welcome back, Student! 📚');
                showStudentDashboard();
                loadStudentClasses(userCredential.user.uid);
            } else {
                signOut(auth);
                showNotification('Access denied: Not a student account', 'error');
            }
            showLoading(false);
        }, {
            onlyOnce: true
        });
    } catch (error) {
        console.error('Login error:', error);
        showNotification(`Login failed: ${error.message}`, 'error');
        showLoading(false);
    }
}

// Updated registration handlers with better error handling
async function registerTeacher() {
  try {
    const email = document.getElementById('new-teacher-email').value.trim();
    const password = document.getElementById('new-teacher-password').value;
    const confirmPassword = document.getElementById('new-teacher-password-confirm').value;

    if (!email || !password || !confirmPassword) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    showLoading(true);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    try {
      await set(ref(database, `users/${userId}`), {
        email,
        role: 'teacher',
        createdAt: Date.now(),
        displayName: email.split('@')[0]
      });
      showNotification('Teacher registration successful! Welcome aboard! 🎉');
      
      // Clear form
      document.getElementById('new-teacher-email').value = '';
      document.getElementById('new-teacher-password').value = '';
      document.getElementById('new-teacher-password-confirm').value = '';
      
      // Hide registration form
      document.getElementById('teacher-register-form').classList.add('hidden');
      
    } catch (dbError) {
      console.error('Database write error:', dbError);
      showNotification('Account created but profile setup failed. Please contact support.', 'error');
    }
  } catch (authError) {
    console.error('Authentication error:', authError);
    showNotification(`Registration failed: ${authError.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

async function registerStudent() {
  try {
    const email = document.getElementById('new-student-email').value.trim();
    const password = document.getElementById('new-student-password').value;
    const confirmPassword = document.getElementById('new-student-password-confirm').value;

    if (!email || !password || !confirmPassword) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    showLoading(true);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    try {
      await set(ref(database, `users/${userId}`), {
        email,
        role: 'student',
        createdAt: Date.now(),
        displayName: email.split('@')[0]
      });
      showNotification('Student registration successful! Welcome! 🎉');
      
      // Clear form
      document.getElementById('new-student-email').value = '';
      document.getElementById('new-student-password').value = '';
      document.getElementById('new-student-password-confirm').value = '';
      
      // Hide registration form
      document.getElementById('student-register-form').classList.add('hidden');
      
    } catch (dbError) {
      console.error('Database write error:', dbError);
      showNotification('Account created but profile setup failed. Please contact support.', 'error');
    }
  } catch (authError) {
    console.error('Authentication error:', authError);
    showNotification(`Registration failed: ${authError.message}`, 'error');
  } finally {
    showLoading(false);
  }
}

// Toggle form visibility functions
function showTeacherRegistration() {
  const teacherForm = document.getElementById('teacher-register-form');
  const studentForm = document.getElementById('student-register-form');
  
  teacherForm.classList.remove('hidden');
  studentForm.classList.add('hidden');
  
  // Smooth scroll to form
  setTimeout(() => {
    teacherForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function showStudentRegistration() {
  const studentForm = document.getElementById('student-register-form');
  const teacherForm = document.getElementById('teacher-register-form');
  
  studentForm.classList.remove('hidden');
  teacherForm.classList.add('hidden');
  
  // Smooth scroll to form
  setTimeout(() => {
    studentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

// Class management
async function joinClass(classCode, userId) {
    if (!classCode || !userId) {
        showNotification('Invalid class code or user ID', 'error');
        return;
    }

    try {
        const classRef = ref(database, `classes/${classCode}`);
        const classSnapshot = await get(classRef);
        
        if (!classSnapshot.exists()) {
            showNotification('Invalid class code. Please check and try again.', 'error');
            return;
        }

        const classData = classSnapshot.val();

        // Add student to class
        await set(ref(database, `classes/${classCode}/students/${userId}`), {
            joinedAt: Date.now(),
            studentEmail: auth.currentUser.email
        });

        // Add class to student's enrolled classes
        await set(ref(database, `users/${userId}/enrolledClasses/${classCode}`), true);

        showNotification(`Successfully joined ${classData.name}! 🎉`);
        loadStudentClasses(userId);
    } catch (error) {
        console.error('Join class error:', error);
        showNotification(`Failed to join class: ${error.message}`, 'error');
    }
}

// Add function to load student's classes
async function loadStudentClasses(userId) {
    const studentClassesRef = ref(database, `users/${userId}/enrolledClasses`);
    const studentClassesList = document.getElementById('student-classes-list');
    
    if (!studentClassesList) return;
    
    studentClassesList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading classes...</div>';

    onValue(studentClassesRef, (snapshot) => {
        const enrolledClasses = snapshot.val();
        studentClassesList.innerHTML = '';
        
        if (!enrolledClasses) {
            studentClassesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open empty-icon"></i>
                    <h3>No Classes Yet</h3>
                    <p>You haven't enrolled in any classes yet. Ask your teacher for a class code to get started!</p>
                </div>
            `;
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
                        <div class="class-card-header">
                            <i class="fas fa-book class-card-icon"></i>
                            <h3>${classData.name}</h3>
                        </div>
                        <div class="class-card-content">
                            <p><i class="fas fa-tag"></i> Subject: ${classData.subject}</p>
                            <p><i class="fas fa-user-tie"></i> Teacher: ${classData.teacherEmail}</p>
                            <p><i class="fas fa-calendar-alt"></i> Joined: ${new Date(classData.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div class="class-card-actions">
                            <button class="btn btn-primary" onclick="handleViewClass('${classCode}')">
                                <i class="fas fa-eye"></i>
                                View Class
                            </button>
                        </div>
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

    const className = document.getElementById('class-name').value.trim();
    const subject = document.getElementById('subject').value.trim();

    if (!className || !subject) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    showLoading(true);

    try {
        const classCode = generateClassCode();
        const classData = {
            name: className,
            subject: subject,
            teacherId: user.uid,
            teacherEmail: user.email,
            createdAt: Date.now(),
            classCode: classCode,
            studentCount: 0
        };

        // Save class data
        await set(ref(database, `classes/${classCode}`), classData);
        
        // Add class reference to teacher's classes
        const teacherClassRef = ref(database, `users/${user.uid}/classes/${classCode}`);
        await set(teacherClassRef, true);

        showNotification(`Class "${className}" created successfully! 🎉`);
        
        // Clear form
        document.getElementById('class-name').value = '';
        document.getElementById('subject').value = '';
        
        loadTeacherClasses();
    } catch (error) {
        console.error('Error creating class:', error);
        showNotification(`Failed to create class: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Load teacher's classes
async function loadTeacherClasses() {
    const user = auth.currentUser;
    if (!user) return;

    const classesList = document.getElementById('classes-list');
    if (!classesList) return;
    
    classesList.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading classes...</div>';

    const teacherClassesRef = ref(database, `users/${user.uid}/classes`);
    
    onValue(teacherClassesRef, (snapshot) => {
        const classesData = snapshot.val();
        classesList.innerHTML = '';
        
        if (!classesData) {
            classesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chalkboard-teacher empty-icon"></i>
                    <h3>No Classes Yet</h3>
                    <p>Create your first class to get started with teaching!</p>
                </div>
            `;
            return;
        }

        const processedClasses = new Set();

        Object.keys(classesData).forEach(classCode => {
            if (!processedClasses.has(classCode)) {
                processedClasses.add(classCode);
                const classRef = ref(database, `classes/${classCode}`);
                
                onValue(classRef, async (classSnapshot) => {
                    const classData = classSnapshot.val();
                    if (classData) {
                        // Get student count
                        const studentsRef = ref(database, `classes/${classCode}/students`);
                        const studentsSnapshot = await get(studentsRef);
                        const studentCount = studentsSnapshot.exists() ? Object.keys(studentsSnapshot.val()).length : 0;
                        
                        const classElement = document.createElement('div');
                        classElement.className = 'class-card';
                        classElement.innerHTML = `
                            <div class="class-card-header">
                                <i class="fas fa-book class-card-icon"></i>
                                <h3>${classData.name}</h3>
                            </div>
                            <div class="class-card-content">
                                <p><i class="fas fa-tag"></i> Subject: ${classData.subject}</p>
                                <p><i class="fas fa-users"></i> Students: ${studentCount}</p>
                                <p><i class="fas fa-calendar-alt"></i> Created: ${new Date(classData.createdAt).toLocaleDateString()}</p>
                                <div class="class-code">
                                    <i class="fas fa-key"></i>
                                    ${classData.classCode}
                                </div>
                            </div>
                            <div class="class-card-actions">
                                <button class="btn btn-primary" onclick="handleViewClass('${classData.classCode}')">
                                    <i class="fas fa-eye"></i>
                                    View Class
                                </button>
                            </div>
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
    
    showLoading(true);
    
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
            <div class="class-view-header">
                <button class="btn back-button" onclick="backToClasses()">
                    <i class="fas fa-arrow-left"></i>
                    Back to Classes
                </button>
                <div class="class-info">
                    <div class="class-title">
                        <i class="fas fa-book class-title-icon"></i>
                        <h2>${classData.name}</h2>
                    </div>
                    <div class="class-meta">
                        <span class="meta-item">
                            <i class="fas fa-tag"></i>
                            ${classData.subject}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-users"></i>
                            ${studentCount} Students
                        </span>
                        <span class="class-code">
                            <i class="fas fa-key"></i>
                            ${classData.classCode}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="assignments-section">
                <div class="section-header">
                    <i class="fas fa-file-alt section-icon"></i>
                    <h3>Assignments</h3>
                </div>
                
                <div class="upload-assignment">
                    <input type="file" 
                           id="assignment-file" 
                           accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx" 
                           style="display: none;">
                    <button class="btn btn-outline" onclick="document.getElementById('assignment-file').click()">
                        <i class="fas fa-paperclip"></i>
                        Choose File
                    </button>
                    <span id="selected-file-name">No file chosen</span>
                    <button class="btn btn-primary" onclick="uploadAssignment('${classCode}')">
                        <i class="fas fa-upload"></i>
                        Upload
                    </button>
                </div>
                
                <div id="assignments-list" class="assignments-list">
                    ${renderAssignments(assignmentsData)}
                </div>
            </div>
        `;
        
        document.querySelector('.classes-section').appendChild(classView);

        // Add file input change listener
        const fileInput = classView.querySelector('#assignment-file');
        const fileNameDisplay = classView.querySelector('#selected-file-name');
        
        fileInput.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || 'No file chosen';
            fileNameDisplay.textContent = fileName;
            fileNameDisplay.style.color = e.target.files[0] ? 'var(--text-primary)' : 'var(--text-muted)';
        });

    } catch (error) {
        console.error('Error viewing class:', error);
        showNotification('Error loading class details', 'error');
    } finally {
        showLoading(false);
    }
}

// Add function to render assignments
function renderAssignments(assignments) {
    if (!assignments) {
        return `
            <div class="empty-state">
                <i class="fas fa-file-alt empty-icon"></i>
                <h4>No Assignments Yet</h4>
                <p>Upload your first assignment to get started!</p>
            </div>
        `;
    }

    return Object.entries(assignments).map(([id, assignment]) => `
        <div class="assignment-item">
            <div class="assignment-info">
                <div class="assignment-icon">
                    <i class="fas fa-file-${getFileIcon(assignment.fileName)}"></i>
                </div>
                <div class="assignment-details">
                    <span class="assignment-name">${assignment.fileName}</span>
                    <span class="assignment-date">
                        <i class="fas fa-clock"></i>
                        Uploaded ${new Date(assignment.uploadedAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
            <div class="assignment-actions">
                <button class="btn btn-outline download-btn" onclick="downloadAssignment('${assignment.downloadURL}', '${assignment.fileName}')">
                    <i class="fas fa-download"></i>
                    Download
                </button>
            </div>
        </div>
    `).join('');
}

// Helper function to get file icon based on extension
function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'pdf',
        'doc': 'word',
        'docx': 'word',
        'ppt': 'powerpoint',
        'pptx': 'powerpoint',
        'xls': 'excel',
        'xlsx': 'excel',
        'txt': 'alt',
        'zip': 'archive',
        'rar': 'archive'
    };
    return iconMap[extension] || 'alt';
}

// Add upload assignment functionality
async function uploadAssignment(classCode) {
    const fileInput = document.getElementById('assignment-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a file first', 'error');
        return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'error');
        return;
    }

    showLoading(true);

    try {
        showNotification('Uploading assignment...', 'info');
        
        // Create a storage reference with timestamp to avoid conflicts
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const fileStorageRef = storageRef(storage, `assignments/${classCode}/${fileName}`);
        
        // Upload file
        const snapshot = await uploadBytes(fileStorageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Save assignment metadata to database
        const assignmentRef = ref(database, `classes/${classCode}/assignments`);
        const newAssignmentRef = push(assignmentRef);
        
        await set(newAssignmentRef, {
            fileName: file.name,
            originalFileName: file.name,
            downloadURL: downloadURL,
            uploadedAt: Date.now(),
            uploadedBy: auth.currentUser.uid,
            fileSize: file.size,
            fileType: file.type
        });

        showNotification(`Assignment "${file.name}" uploaded successfully! 🎉`);
        
        // Refresh assignments list
        const assignmentsSnapshot = await get(assignmentRef);
        const assignmentsDiv = document.getElementById('assignments-list');
        assignmentsDiv.innerHTML = renderAssignments(assignmentsSnapshot.val());
        
        // Clear file input
        fileInput.value = '';
        document.getElementById('selected-file-name').textContent = 'No file chosen';
        document.getElementById('selected-file-name').style.color = 'var(--text-muted)';
        
    } catch (error) {
        console.error('Error uploading assignment:', error);
        showNotification('Failed to upload assignment: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Add download assignment functionality
async function downloadAssignment(downloadURL, fileName) {
    try {
        showNotification('Downloading file...', 'info');
        
        const response = await fetch(downloadURL);
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification(`Downloaded "${fileName}" successfully! 📥`);
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
        showLoading(true);
        await signOut(auth);
        showAuthSection();
        showNotification('Logged out successfully. See you soon! 👋');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification(`Logout failed: ${error.message}`, 'error');
    } finally {
        showLoading(false);
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
                    loadStudentClasses(user.uid);
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
window.createClass = createClass;
window.handleViewClass = handleViewClass;
window.backToClasses = backToClasses;
window.uploadAssignment = uploadAssignment;
window.downloadAssignment = downloadAssignment;
window.logoutUser = logoutUser;