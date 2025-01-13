const appData = {
    classes: {},
    resources: {},
    currentUser: null,
    currentClassCode: null,
    messages: [],
    activities: [],
    theme: 'dark'
};

function loginTeacher() {
    const username = document.getElementById('teacher-username').value;
    if (!username) {
        showNotification('Please enter a username', 'error');
        return;
    }

    appData.currentUser = {
        username: username,
        isTeacher: true
    };

    document.getElementById('login-sections').classList.add('hidden');
    document.getElementById('room-creation').classList.remove('hidden');
    document.getElementById('teacher-name').textContent = username;
    showNotification('Successfully logged in as teacher');
}

function createNewClass() {
    const classCode = Math.random().toString(36).substring(7).toUpperCase();
    appData.classes[classCode] = {
        teacher: appData.currentUser.username,
        students: {},
        resources: {}
    };
    appData.currentClassCode = classCode;

    document.getElementById('room-creation').classList.add('hidden');
    document.getElementById('classroom-section').classList.remove('hidden');
    document.getElementById('current-class-code').textContent = classCode;

    showNotification(`New classroom created! Code: ${classCode}`);
    updateDashboard();
}

function loginStudent() {
    const username = document.getElementById('student-username').value;
    const classCode = document.getElementById('class-code').value;
    
    if (!username || !classCode) {
        showNotification('Please enter both username and class code', 'error');
        return;
    }

    if (!appData.classes[classCode]) {
        showNotification('Invalid class code!', 'error');
        return;
    }

    appData.currentUser = {
        username: username,
        isTeacher: false
    };
    appData.currentClassCode = classCode;
    appData.classes[classCode].students[username] = true;

    document.getElementById('login-sections').classList.add('hidden');
    document.getElementById('classroom-section').classList.remove('hidden');
    document.getElementById('current-class-code').textContent = classCode;

    showNotification('Successfully joined the class');
    updateDashboard();
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

function uploadResource() {
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
        deadline: deadline,
        uploadedBy: appData.currentUser.username,
        classCode: appData.currentClassCode,
        timestamp: new Date().toISOString()
    };

    const resourceId = Math.random().toString(36).substring(7);
    appData.resources[resourceId] = resource;

    showNotification('Resource uploaded successfully');
    updateDashboard();
    loadResources();
}

function updateDashboard() {
    const activeStudents = document.getElementById('active-students');
    const currentClass = appData.classes[appData.currentClassCode];
    if (currentClass) {
        const studentCount = Object.keys(currentClass.students).length;
        activeStudents.innerHTML = `<p>${studentCount} students enrolled</p>`;
    }
}
function downloadResource(resourceId) {
const resource = appData.resources[resourceId];
if (!resource) {
    showNotification('Resource not found!', 'error');
    return;
}

// Simulate a download
const link = document.createElement('a');
link.href = URL.createObjectURL(new Blob([resource.name], { type: resource.type }));
link.download = resource.name;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

showNotification('Download started successfully!');
}

function loadResources() {
const container = document.getElementById('resources-container');
container.innerHTML = '';

Object.entries(appData.resources)
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
}