// Admin Authentication Management
const API_BASE_URL = 'http://localhost:5000/api';
let currentUser = null;
let adminToken = null;

// Check admin authentication status on page load
window.addEventListener('load', () => {
    checkAdminAuth();
});

// Also check immediately when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements first
    initializeDOMElements();
    
    // Initialize guest interface immediately when DOM is ready
    showGuestInterface();
    checkAdminAuth();
});

function checkAdminAuth() {
    console.log('Checking admin authentication...');
    adminToken = localStorage.getItem('adminToken');
    console.log('Admin token found:', !!adminToken);
    
    if (adminToken) {
        // Verify token with server
        fetch(`${API_BASE_URL}/admin/verify`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        })
        .then(res => res.json())
        .then(result => {
            console.log('Token verification result:', result);
            if (result.success) {
                currentUser = JSON.parse(localStorage.getItem('adminUser'));
                console.log('Admin user loaded:', currentUser);
                showAdminInterface();
            } else {
                console.log('Token invalid, logging out');
                adminLogout();
            }
        })
        .catch((error) => {
            console.log('Token verification failed:', error);
            adminLogout();
        });
    } else {
        console.log('No admin token, showing guest interface');
        showGuestInterface();
    }
}

function showAdminInterface() {
    console.log('=== SHOWING ADMIN INTERFACE ===');
    const adminSection = document.getElementById('admin-nav-section');
    const guestSection = document.getElementById('guest-nav-section');
    
    if (adminSection) {
        console.log('Admin section found, making it visible');
        adminSection.classList.add('show');
        adminSection.style.display = 'flex';
        console.log('Admin section display:', adminSection.style.display);
    } else {
        console.log('ERROR: Admin section not found!');
    }
    
    if (guestSection) {
        console.log('Guest section found, hiding it');
        guestSection.style.display = 'none';
    } else {
        console.log('ERROR: Guest section not found!');
    }
    
    // Show success notification
    showSuccessNotification('✅ Admin logged in successfully! You can now manage content.');
}

function showGuestInterface() {
    console.log('=== SHOWING GUEST INTERFACE ===');
    const adminSection = document.getElementById('admin-nav-section');
    const guestSection = document.getElementById('guest-nav-section');
    
    if (adminSection) {
        console.log('Admin section found, hiding it');
        adminSection.classList.remove('show');
        adminSection.style.display = 'none';
        console.log('Admin section display:', adminSection.style.display);
    } else {
        console.log('ERROR: Admin section not found!');
    }
    
    if (guestSection) {
        console.log('Guest section found, making it visible');
        guestSection.style.display = 'flex';
    } else {
        console.log('ERROR: Guest section not found!');
    }
}

function adminLogout() {
    console.log('=== ADMIN LOGOUT ===');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    adminToken = null;
    currentUser = null;
    showGuestInterface();
    console.log('Admin logged out, localStorage cleared');
}

// Force logout function for testing
function forceLogout() {
    console.log('Force logout called');
    adminLogout();
}

// Add to global scope for testing
window.forceLogout = forceLogout;

// Upload Modal Functions
function showUploadModal() {
    if (!adminToken) {
        alert('Please login as admin first');
        window.location.href = 'admin-login.html';
        return;
    }
    document.getElementById('upload-modal').style.display = 'block';
}

function closeUploadModal() {
    document.getElementById('upload-modal').style.display = 'none';
    document.getElementById('upload-form').reset();
}

// Handle upload form submission
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleFileUpload();
        });
    }
});

async function handleFileUpload() {
    if (!adminToken) {
        alert('Please login as admin first');
        return;
    }

    const form = document.getElementById('upload-form');
    const formData = new FormData();
    
    // Get form values
    const semester = document.getElementById('upload-semester').value;
    const subject = document.getElementById('upload-subject').value;
    const category = document.getElementById('upload-category').value;
    const title = document.getElementById('upload-title').value;
    const description = document.getElementById('upload-description').value;
    const fileInput = document.getElementById('upload-file');
    
    if (!fileInput.files[0]) {
        alert('Please select a file to upload');
        return;
    }
    
    // Append form data
    formData.append('semester', semester);
    formData.append('subject', subject);
    formData.append('category', category);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', fileInput.files[0]);
    
    const uploadBtn = form.querySelector('.btn-upload');
    const originalText = uploadBtn.innerHTML;
    
    try {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        console.log('🔐 Using admin token:', adminToken ? 'Present' : 'Missing');
        console.log('📤 Uploading to:', `${API_BASE_URL}/content/upload`);
        
        const response = await fetch(`${API_BASE_URL}/content/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server response not ok:', response.status, errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Upload result:', result);
        
        if (result.success) {
            alert('File uploaded successfully!');
            closeUploadModal();
            // Refresh content if we're viewing the same category
            const modalSubjectTitle = document.getElementById('modal-subject-title').textContent;
            if (modalSubjectTitle && modalSubjectTitle.toLowerCase().includes(subject.toLowerCase())) {
                loadSubjectContent(subject.toLowerCase().replace(/\s+/g, '-'), semester);
            }
        } else {
            alert(result.message || 'Upload failed');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Upload failed. ';
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Cannot connect to server. Please check if the server is running on http://localhost:5000';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage += 'Authentication failed. Please login as admin again.';
        } else if (error.message.includes('413') || error.message.includes('too large')) {
            errorMessage += 'File is too large. Maximum size is 100MB.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        alert(errorMessage);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = originalText;
    }
}

// Delete content function (admin only)
async function deleteContent(contentId, filename) {
    if (!adminToken) {
        alert('Please login as admin first');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/content/${contentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Content deleted successfully!');
            // Refresh the current view
            location.reload();
        } else {
            alert(result.message || 'Delete failed');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Delete failed. Please try again.');
    }
}

// B.Sc. Computer Science Semester Data Structure
const bscCSData = {
    1: {
        title: 'First Semester',
        subjects: {
            'programming-fundamentals': {
                title: 'Programming Fundamentals',
                code: 'CSC101',
                icon: 'fas fa-code',
                description: 'Introduction to programming with C language'
            },
            'computer-fundamentals': {
                title: 'Computer Fundamentals',
                code: 'CSC102',
                icon: 'fas fa-desktop',
                description: 'Basic computer concepts and architecture'
            },
            'mathematics-1': {
                title: 'Mathematics I',
                code: 'MAT101',
                icon: 'fas fa-square-root-alt',
                description: 'Calculus and analytical geometry'
            },
            'english': {
                title: 'English Communication',
                code: 'ENG101',
                icon: 'fas fa-book',
                description: 'Communication skills and technical writing'
            },
            'physics': {
                title: 'Physics',
                code: 'PHY101',
                icon: 'fas fa-atom',
                description: 'Basic physics concepts for computer science'
            }
        }
    },
    2: {
        title: 'Second Semester',
        subjects: {
            'object-oriented-programming': {
                title: 'Object Oriented Programming',
                code: 'CSC201',
                icon: 'fas fa-cubes',
                description: 'OOP concepts using C++ and Java'
            },
            'data-structures': {
                title: 'Data Structures',
                code: 'CSC202',
                icon: 'fas fa-sitemap',
                description: 'Linear and non-linear data structures'
            },
            'discrete-mathematics': {
                title: 'Discrete Mathematics',
                code: 'MAT201',
                icon: 'fas fa-calculator',
                description: 'Logic, sets, and discrete structures'
            },
            'digital-electronics': {
                title: 'Digital Electronics',
                code: 'ELC201',
                icon: 'fas fa-microchip',
                description: 'Digital circuits and logic design'
            },
            'mathematics-2': {
                title: 'Mathematics II',
                code: 'MAT202',
                icon: 'fas fa-square-root-alt',
                description: 'Advanced calculus and linear algebra'
            }
        }
    },
    3: {
        title: 'Third Semester',
        subjects: {
            'database-management': {
                title: 'Database Management Systems',
                code: 'CSC301',
                icon: 'fas fa-database',
                description: 'Database design and SQL programming'
            },
            'computer-networks': {
                title: 'Computer Networks',
                code: 'CSC302',
                icon: 'fas fa-network-wired',
                description: 'Network protocols and architectures'
            },
            'algorithms': {
                title: 'Algorithm Analysis',
                code: 'CSC303',
                icon: 'fas fa-project-diagram',
                description: 'Algorithm design and complexity analysis'
            },
            'operating-systems': {
                title: 'Operating Systems',
                code: 'CSC304',
                icon: 'fas fa-cogs',
                description: 'OS concepts and system programming'
            },
            'statistics': {
                title: 'Statistics',
                code: 'STA301',
                icon: 'fas fa-chart-bar',
                description: 'Statistical methods for computer science'
            }
        }
    },
    4: {
        title: 'Fourth Semester',
        subjects: {
            'web-development': {
                title: 'Web Development',
                code: 'CSC401',
                icon: 'fas fa-globe',
                description: 'HTML, CSS, JavaScript, and web frameworks'
            },
            'software-engineering': {
                title: 'Software Engineering',
                code: 'CSC402',
                icon: 'fas fa-tools',
                description: 'Software development lifecycle and methodologies'
            },
            'computer-graphics': {
                title: 'Computer Graphics',
                code: 'CSC403',
                icon: 'fas fa-paint-brush',
                description: 'Graphics programming and visualization'
            },
            'numerical-methods': {
                title: 'Numerical Methods',
                code: 'MAT401',
                icon: 'fas fa-calculator',
                description: 'Computational mathematics and algorithms'
            },
            'system-analysis': {
                title: 'System Analysis & Design',
                code: 'CSC404',
                icon: 'fas fa-drafting-compass',
                description: 'System design and analysis techniques'
            }
        }
    },
    5: {
        title: 'Fifth Semester',
        subjects: {
            'artificial-intelligence': {
                title: 'Artificial Intelligence',
                code: 'CSC501',
                icon: 'fas fa-brain',
                description: 'AI concepts and machine learning basics'
            },
            'compiler-design': {
                title: 'Compiler Design',
                code: 'CSC502',
                icon: 'fas fa-code-branch',
                description: 'Language processing and compiler construction'
            },
            'mobile-computing': {
                title: 'Mobile Computing',
                code: 'CSC503',
                icon: 'fas fa-mobile-alt',
                description: 'Mobile app development and technologies'
            },
            'information-security': {
                title: 'Information Security',
                code: 'CSC504',
                icon: 'fas fa-shield-alt',
                description: 'Cybersecurity and data protection'
            },
            'elective-1': {
                title: 'Elective I',
                code: 'CSC505',
                icon: 'fas fa-star',
                description: 'Choose from available specialization subjects'
            }
        }
    },
    6: {
        title: 'Sixth Semester',
        subjects: {
            'project-work': {
                title: 'Final Year Project',
                code: 'CSC601',
                icon: 'fas fa-project-diagram',
                description: 'Capstone project and research work'
            },
            'cloud-computing': {
                title: 'Cloud Computing',
                code: 'CSC602',
                icon: 'fas fa-cloud',
                description: 'Cloud platforms and distributed computing'
            },
            'data-mining': {
                title: 'Data Mining',
                code: 'CSC603',
                icon: 'fas fa-search',
                description: 'Data analysis and knowledge discovery'
            },
            'human-computer-interaction': {
                title: 'Human Computer Interaction',
                code: 'CSC604',
                icon: 'fas fa-users',
                description: 'UI/UX design and usability principles'
            },
            'elective-2': {
                title: 'Elective II',
                code: 'CSC605',
                icon: 'fas fa-star',
                description: 'Advanced specialization subject'
            },
            'internship': {
                title: 'Industrial Training',
                code: 'CSC606',
                icon: 'fas fa-building',
                description: 'Practical industry experience'
            }
        }
    }
};

// Comprehensive Notes Content for B.Sc. Computer Science
const notesDatabase = {};

// Sample content structure for each subject
const sampleContentStructure = {
    'teacher-notes': [],
    'student-notes': [],
    'resources': [],
    'assignments': [],
    'pyqs': [],
    'syllabus': []
};

// DOM Elements
let navToggle, navMenu, modal, modalTitle, modalContentArea;

// Initialize DOM elements when page loads
function initializeDOMElements() {
    navToggle = document.getElementById('nav-toggle');
    navMenu = document.getElementById('nav-menu');
    modal = document.getElementById('subject-modal');
    modalTitle = document.getElementById('modal-subject-title');
    modalContentArea = document.getElementById('modal-content-area');
    
    console.log('DOM Elements initialized:', {
        navToggle: !!navToggle,
        navMenu: !!navMenu,
        modal: !!modal
    });
    
    // Add event listeners
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            console.log('Mobile nav toggle clicked');
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    } else {
        console.error('Navigation elements not found:', { navToggle, navMenu });
    }
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navToggle) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
}

// Global variables
let selectedSemester = 0;

// Navigation functionality will be initialized in DOMContentLoaded

// Update active nav link based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Smooth scroll function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth'
        });
    }
}



// Semester selection functionality
function selectSemester(semesterNumber) {
    selectedSemester = semesterNumber;
    
    if (bscCSData[semesterNumber]) {
        const semester = bscCSData[semesterNumber];
        
        // Update UI
        document.getElementById('selected-semester-info').textContent = semester.title;
        
        // Load subjects
        loadSubjects(semester.subjects);
        
        // Show subjects section
        document.getElementById('semesters').style.display = 'none';
        document.getElementById('subjects-list').style.display = 'block';
        
        // Add animation and scroll
        const subjectsSection = document.getElementById('subjects-list');
        subjectsSection.classList.add('fade-in');
        subjectsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Load subjects for selected semester
function loadSubjects(subjects) {
    const container = document.getElementById('subjects-container');
    container.innerHTML = '';
    
    Object.keys(subjects).forEach((subjectKey, index) => {
        const subject = subjects[subjectKey];
        const subjectCard = document.createElement('div');
        subjectCard.className = 'subject-card';
        subjectCard.style.animationDelay = `${index * 0.1}s`;
        
        // Add click event listener
        subjectCard.addEventListener('click', () => {
            console.log('Subject card clicked:', subject.title);
            openSubject(subjectKey, subject);
        });
        
        // Also keep the onclick for backup
        subjectCard.onclick = () => openSubject(subjectKey, subject);
        
        subjectCard.innerHTML = `
            <div class="subject-icon">
                <i class="${subject.icon}"></i>
            </div>
            <h3>${subject.title}</h3>
            <p>${subject.description}</p>
            <span class="subject-code">${subject.code}</span>
        `;
        
        container.appendChild(subjectCard);
    });
}

// Navigation functions
function goBackToCourses() {
    document.getElementById('semesters').style.display = 'none';
    document.getElementById('subjects').style.display = 'block';
    document.getElementById('subjects').scrollIntoView({ behavior: 'smooth' });
}

function goBackToSemesters() {
    document.getElementById('subjects-list').style.display = 'none';
    document.getElementById('semesters').style.display = 'block';
    document.getElementById('semesters').scrollIntoView({ behavior: 'smooth' });
}

// Open subject modal
function openSubject(subjectKey, subjectData) {
    console.log('Opening subject:', subjectData.title);
    
    const modal = document.getElementById('subject-modal');
    const modalTitle = document.getElementById('modal-subject-title');
    
    if (modal && modalTitle) {
        modalTitle.textContent = subjectData.title;
        
        // Show modal with proper animation
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Add show class after a small delay for animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        console.log('Modal should be visible now');
        
        // Initialize the first tab
        showTab('teacher-notes');
    } else {
        console.error('Modal elements not found');
        console.log('Modal element:', modal);
        console.log('Modal title element:', modalTitle);
        alert('Modal not found. Please check if the HTML contains the subject-modal element.');
    }
}

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
    if (event.target === document.getElementById('add-content-modal')) {
        closeAddContentModal();
    }
});

// Close modal
function closeModal() {
    const modal = document.getElementById('subject-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// Debug function to check modal elements
function debugModalElements() {
    console.log('Checking modal elements:');
    console.log('subject-modal:', document.getElementById('subject-modal'));
    console.log('modal-subject-title:', document.getElementById('modal-subject-title'));
    console.log('modal-content-area:', document.getElementById('modal-content-area'));
    
    // Also check if modal tabs exist
    const modalTabs = document.querySelector('.modal-tabs');
    console.log('modal-tabs:', modalTabs);
    
    if (!document.getElementById('subject-modal')) {
        console.error('Subject modal not found in HTML!');
    }
}

// Content management storage (using MongoDB API)
let contentDatabase = {}; // Cache for frontend

// API helper functions
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        // Fallback to localStorage if API is not available
        return handleOfflineMode(url, options);
    }
}

// Fallback to localStorage when server is not available
function handleOfflineMode(url, options) {
    console.warn('Server not available, using offline mode with localStorage');
    const localData = JSON.parse(localStorage.getItem('contentDatabase')) || {};
    
    if (options.method === 'POST') {
        // Handle adding content offline
        return { success: true, message: 'Content will be synced when server is available' };
    }
    
    // Return cached data for GET requests
    return { success: true, data: [] };
}

// Load content from MongoDB
async function loadContentFromDatabase(semester, subject, tab) {
    try {
        const params = new URLSearchParams();
        if (semester) params.append('semester', semester);
        if (subject) params.append('subject', subject);
        if (tab) params.append('category', tab); // Changed from 'tab' to 'category'
        
        const result = await apiRequest(`/content?${params.toString()}`);
        
        if (result.success) {
            return result.data || [];
        }
        return [];
    } catch (error) {
        console.error('Error loading content:', error);
        return [];
    }
}

// Add content to MongoDB
async function addContentToDatabase(contentData) {
    try {
        const result = await apiRequest('/content', {
            method: 'POST',
            body: JSON.stringify(contentData)
        });
        
        if (result.success) {
            return result;
        }
        throw new Error(result.message || 'Failed to add content');
    } catch (error) {
        console.error('Error adding content:', error);
        throw error;
    }
}

// Simple content display - no complex modals needed

// Complex modal functions removed - using simple upload instead

// Close add content modal
function closeAddContentModal() {
    const addContentModal = document.getElementById('add-content-modal');
    if (addContentModal) {
        addContentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Save content
async function saveContent(event) {
    event.preventDefault();
    
    const addContentModal = document.getElementById('add-content-modal');
    const tabName = addContentModal.dataset.tabName;
    const subjectKey = addContentModal.dataset.subjectKey;
    const title = document.getElementById('content-title-input').value.trim();
    const description = document.getElementById('content-description-input').value.trim();
    const type = document.getElementById('content-type-select').value;
    const fileInput = document.getElementById('file-upload-input');
    const manualSize = document.getElementById('content-size-input').value.trim();
    
    if (!title || !description) {
        alert('Please fill in both title and description.');
        return;
    }
    
    // Get current semester from the UI
    const currentSemester = getCurrentSemester();
    
    try {
        // Show loading state
        const saveButton = document.querySelector('.save-btn');
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Uploading...';
        saveButton.disabled = true;
        
        let result;
        
        if (fileInput.files && fileInput.files[0]) {
            // Upload with file
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('semester', currentSemester);
            formData.append('subject', subjectKey);
            formData.append('category', tabName); // Changed from 'tab' to 'category'
            formData.append('title', title);
            formData.append('description', description);
            formData.append('type', type);
            
            result = await uploadContentWithFile(formData);
        } else {
            // Upload without file (metadata only)
            const contentData = {
                semester: currentSemester,
                subject: subjectKey,
                category: tabName, // Changed from 'tab' to 'category'
                title: title,
                description: description,
                type: type,
                size: manualSize || 'Unknown size'
            };
            
            result = await addContentToDatabase(contentData);
        }
        
        // Close modal
        closeAddContentModal();
        
        // Refresh the current tab display
        await showTab(tabName);
        
        // Show success message
        const fileUploadedText = fileInput.files && fileInput.files[0] ? ' and file uploaded' : '';
        showSuccessNotification(`${type} added successfully${fileUploadedText} to ${tabName.replace('-', ' ')}!`);
        
    } catch (error) {
        console.error('Error saving content:', error);
        alert('Failed to save content. Please try again.');
        
        // Restore button state
        const saveButton = document.querySelector('.save-btn');
        if (saveButton) {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }
    }
}

// Upload content with file
async function uploadContentWithFile(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/content/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData // Don't set Content-Type header, let browser set it for FormData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            return result;
        }
        throw new Error(result.message || 'Failed to upload content');
    } catch (error) {
        console.error('Error uploading content with file:', error);
        throw error;
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get current semester
function getCurrentSemester() {
    const selectedSemesterInfo = document.getElementById('selected-semester-info');
    if (selectedSemesterInfo && selectedSemesterInfo.textContent) {
        const match = selectedSemesterInfo.textContent.match(/(\d+)/);
        return match ? parseInt(match[1]) : 1;
    }
    return 1; // Default to semester 1
}

// Show success notification
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Update showTab function to use MongoDB content
async function showTab(tabName) {
    console.log('showTab called with:', tabName);
    
    const tabButtons = document.querySelectorAll('.tab-button');
    const modalContentArea = document.getElementById('modal-content-area');
    
    if (!modalContentArea) {
        console.error('modal-content-area not found');
        return;
    }
    
    console.log('Found', tabButtons.length, 'tab buttons');
    
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Find and activate the clicked tab
    tabButtons.forEach(button => {
        if (button.textContent.toLowerCase().includes(tabName.replace('-', ' '))) {
            button.classList.add('active');
        }
    });
    
    // Get current subject key from modal title
    const modalTitle = document.getElementById('modal-subject-title').textContent;
    const currentSubjectKey = findSubjectKeyByTitle(modalTitle);
    const currentSemester = getCurrentSemester();
    
    // Show loading state
    modalContentArea.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Loading ${tabName.replace('-', ' ')}...</p>
        </div>
    `;
    
    try {
        // Load content from MongoDB
        const content = await loadContentFromDatabase(currentSemester, currentSubjectKey, tabName);
        
        if (content && content.length > 0) {
            displayTabContent(tabName, content);
        } else {
            // Check if we have real content for this subject and tab
            const realContent = notesDatabase[currentSubjectKey] && notesDatabase[currentSubjectKey][tabName];
            if (realContent) {
                displayRealContent(tabName, realContent);
            } else {
                displayTabContent(tabName, sampleContentStructure[tabName] || []);
            }
        }
    } catch (error) {
        console.error('Error loading tab content:', error);
        modalContentArea.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #ff6b6b;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Error loading content. Please try again.</p>
                <button class="add-content-btn" onclick="showTab('${tabName}')" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Find subject key by title
function findSubjectKeyByTitle(title) {
    for (let semesterNum in bscCSData) {
        const subjects = bscCSData[semesterNum].subjects;
        for (let key in subjects) {
            if (subjects[key].title === title) {
                return key;
            }
        }
    }
    return null;
}

// Display tab content (updated for MongoDB format)
function displayTabContent(tabName, items) {
    if (!items || items.length === 0) {
        modalContentArea.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <div class="tab-header">
                    <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No ${tabName.replace('-', ' ')} available yet.</p>
                    <p style="font-size: 0.9rem;">Upload files directly below:</p>
                </div>
                
                <!-- Simple File Upload Section -->
                <div class="simple-upload-section" style="margin-top: 2rem;">
                    <h3>📁 Upload ${tabName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    
                    <!-- Title Input Field -->
                    <div style="margin: 20px auto; max-width: 400px;">
                        <label for="upload-title-${tabName}" style="display: block; color: #fff; font-weight: 500; margin-bottom: 8px;">
                            📝 Topic/Title:
                        </label>
                        <input type="text" id="upload-title-${tabName}" 
                               placeholder="e.g., Introduction to Programming, Data Structures Chapter 1, etc."
                               style="
                                   width: 100%;
                                   padding: 12px;
                                   border: 1px solid #555;
                                   border-radius: 8px;
                                   background: #2a2a2a;
                                   color: #fff;
                                   font-size: 14px;
                                   box-sizing: border-box;
                               ">
                        <small style="color: #888; font-size: 12px;">Enter what this file is about</small>
                    </div>
                    
                    <div class="upload-area" style="
                        border: 2px dashed #555;
                        border-radius: 12px;
                        padding: 40px;
                        margin: 20px auto;
                        max-width: 400px;
                        background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                        cursor: pointer;
                        transition: all 0.3s ease;
                    " onclick="handleUploadClick('${tabName}')">
                        <input type="file" id="simple-file-input-${tabName}" 
                               accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar" 
                               style="display: none;">
                        <div>
                            <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #666; margin-bottom: 15px;"></i>
                            <h4 style="color: #fff; margin-bottom: 10px;">Click here to select file</h4>
                            <p id="file-info-${tabName}" style="color: #888; font-size: 0.9rem;">No file selected</p>
                            <small style="color: #888;">Max 100MB | PDF, DOC, PPT, Images, Videos, etc.</small>
                        </div>
                    </div>
                    
                    <div id="upload-status-${tabName}" style="
                        margin: 15px 0;
                        padding: 10px;
                        background: #333;
                        border-radius: 8px;
                        color: #fff;
                    ">Ready to upload</div>
                </div>
            </div>
        `;
        
        // Add event listeners for this specific tab
        setupSimpleUpload(tabName);
        return;
    }

    let content = `
        <div class="tab-content-header">
            <h3>${tabName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
            <button class="add-content-btn-small" onclick="scrollToUploadSection('${tabName}')" title="Upload new ${tabName.replace('-', ' ')}">
                <i class="fas fa-plus"></i> Upload New
            </button>
        </div>
    `;
    
    items.forEach(item => {
        // Format date for display
        const itemDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 
                        item.date || new Date().toLocaleDateString();
        
        // Get appropriate icon for file type
        const getFileIcon = (type) => {
            const iconMap = {
                'PDF': 'fa-file-pdf',
                'DOC': 'fa-file-word',
                'PPT': 'fa-file-powerpoint', 
                'VIDEO': 'fa-file-video',
                'AUDIO': 'fa-file-audio',
                'LINK': 'fa-link',
                'TEXT': 'fa-file-text'
            };
            return iconMap[type.toUpperCase()] || 'fa-file';
        };
        
        const deleteButtonHtml = adminToken ? `
            <button class="delete-btn" onclick="deleteContent('${item._id || item.id}', '${item.title}')" 
                    title="Delete this file">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        ` : '';
        
        content += `
            <div class="content-item animate-in" id="content-item-${item._id || item.id}">
                <div class="content-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                    ${deleteButtonHtml}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.8rem; color: #888;">
                    <span><i class="fas ${getFileIcon(item.type)}"></i> ${item.type} • ${item.size}</span>
                    <span><i class="fas fa-calendar"></i> ${itemDate}</span>
                </div>
                <div class="content-actions" style="margin-top: 10px; display: flex; gap: 10px;">
                    ${item.fileUrl ? 
                        `<button class="download-btn" onclick="downloadFile('${item.fileUrl}', '${item.originalFileName || item.title}')" style="
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            padding: 8px 16px;
                            cursor: pointer;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            transition: all 0.3s ease;
                        ">
                            <i class="fas fa-download"></i> Download File
                        </button>` :
                        `<button class="download-btn" onclick="downloadItem('${item.title}', '${item.type}')" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            padding: 8px 16px;
                            cursor: pointer;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            opacity: 0.6;
                        ">
                            <i class="fas fa-info-circle"></i> No File Available
                        </button>`
                    }
                </div>
            </div>
        `;
    });
    
    // Add upload section at the end for adding more files (hidden by default)
    content += `
        <div class="upload-section-divider" id="upload-section-${tabName}" style="
            margin: 2rem 0;
            padding: 1rem 0;
            border-top: 1px solid #444;
            text-align: center;
            display: none;
        ">
            <h4 style="color: #888; margin-bottom: 1rem;">📁 Upload More Files</h4>
            
            <!-- Title Input Field -->
            <div style="margin: 20px auto; max-width: 400px;">
                <label for="upload-title-${tabName}" style="display: block; color: #fff; font-weight: 500; margin-bottom: 8px;">
                    📝 Topic/Title:
                </label>
                <input type="text" id="upload-title-${tabName}" 
                       placeholder="e.g., Introduction to Programming, Data Structures Chapter 1, etc."
                       style="
                           width: 100%;
                           padding: 12px;
                           border: 1px solid #555;
                           border-radius: 8px;
                           background: #2a2a2a;
                           color: #fff;
                           font-size: 14px;
                           box-sizing: border-box;
                       ">
                <small style="color: #888; font-size: 12px;">Enter what this file is about</small>
            </div>
            
            <div class="upload-area" style="
                border: 2px dashed #555;
                border-radius: 12px;
                padding: 30px;
                margin: 20px auto;
                max-width: 400px;
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                cursor: pointer;
                transition: all 0.3s ease;
            " onclick="handleUploadClick('${tabName}')">
                <input type="file" id="simple-file-input-${tabName}" 
                       accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar" 
                       style="display: none;">
                <div>
                    <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: #666; margin-bottom: 10px;"></i>
                    <h4 style="color: #fff; margin-bottom: 8px;">Click here to select file</h4>
                    <p id="file-info-${tabName}" style="color: #888; font-size: 0.9rem;">No file selected</p>
                    <small style="color: #888;">Max 100MB | PDF, DOC, PPT, Images, Videos, etc.</small>
                </div>
            </div>
            
            <div id="upload-status-${tabName}" style="
                margin: 15px 0;
                padding: 10px;
                background: #333;
                border-radius: 8px;
                color: #fff;
            ">Ready to upload</div>
            
            <button onclick="hideUploadSection('${tabName}')" style="
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 10px;
            ">
                <i class="fas fa-times"></i> Cancel
            </button>
        </div>
    `;
    
    modalContentArea.innerHTML = content;
    
    // Set up upload functionality for this tab
    setupSimpleUpload(tabName);
    
    // Trigger animations for new content
    setTimeout(() => {
        const contentItems = modalContentArea.querySelectorAll('.content-item');
        contentItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animate-in');
            }, index * 100);
        });
    }, 50);
}

// Display real content (for subjects that have detailed content)
function displayRealContent(tabName, contentArray) {
    let content = '';
    contentArray.forEach((item, index) => {
        content += `
            <div class="content-item real-content-item">
                <h4>${item.title}</h4>
                <div class="content-body">
                    ${item.content}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.8rem; color: #888;">
                    <span><i class="fas fa-user"></i> ${item.author}</span>
                    <span><i class="fas fa-calendar"></i> ${item.date}</span>
                </div>
            </div>
        `;
    });
    
    modalContentArea.innerHTML = content;
}

// Download actual file
function downloadFile(fileUrl, fileName) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download item (placeholder function for items without files)
function downloadItem(title, type) {
    // In a real implementation, this would trigger an actual download
    alert(`No file available for: ${title} (${type})\n\nThis content was added without a file upload.`);
}

// Handle upload click with title validation
function handleUploadClick(tabName) {
    // Check admin authentication first
    if (!adminToken) {
        const uploadStatus = document.getElementById(`upload-status-${tabName}`);
        uploadStatus.textContent = '🔒 Admin login required to upload files';
        uploadStatus.style.background = '#dc3545';
        uploadStatus.style.color = '#fff';
        
        // Just show the message, don't redirect
        return;
    }
    
    const titleInput = document.getElementById(`upload-title-${tabName}`);
    const uploadStatus = document.getElementById(`upload-status-${tabName}`);
    
    if (!titleInput.value.trim()) {
        uploadStatus.textContent = '⚠️ Please enter a topic/title first';
        uploadStatus.style.background = '#ffc107';
        uploadStatus.style.color = '#000';
        titleInput.focus();
        titleInput.style.borderColor = '#ffc107';
        
        // Reset warning after 3 seconds
        setTimeout(() => {
            uploadStatus.textContent = 'Ready to upload';
            uploadStatus.style.background = '#333';
            uploadStatus.style.color = '#fff';
            titleInput.style.borderColor = '#555';
        }, 3000);
        return;
    }
    
    // Title is provided, proceed with file selection
    document.getElementById(`simple-file-input-${tabName}`).click();
}

// Simple upload function - just like the test page
function setupSimpleUpload(tabName) {
    const fileInput = document.getElementById(`simple-file-input-${tabName}`);
    const fileInfo = document.getElementById(`file-info-${tabName}`);
    const uploadStatus = document.getElementById(`upload-status-${tabName}`);
    const titleInput = document.getElementById(`upload-title-${tabName}`);
    const uploadArea = document.querySelector('.upload-area');
    
    if (!fileInput || !fileInfo || !uploadStatus || !titleInput) {
        console.error('Simple upload elements not found for tab:', tabName);
        return;
    }
    
    console.log('✅ Setting up simple upload for:', tabName);
    
    // File selection handler
    fileInput.addEventListener('change', async function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const title = titleInput.value.trim();
            
            console.log('✅ File selected:', file.name, file.size, 'Title:', title);
            
            // Update UI
            fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            uploadStatus.textContent = 'Uploading...';
            uploadStatus.style.background = '#007bff';
            uploadArea.style.borderColor = '#28a745';
            uploadArea.style.background = 'linear-gradient(135deg, #1a2e1a, #2a4a2a)';
            
            // Upload file with custom title
            try {
                const result = await uploadFileDirectly(file, tabName, title);
                
                if (result.success) {
                    uploadStatus.textContent = '✅ Upload successful!';
                    uploadStatus.style.background = '#28a745';
                    
                    // Clear the form
                    titleInput.value = '';
                    fileInput.value = '';
                    
                    // Refresh the tab content after successful upload
                    setTimeout(() => {
                        showTab(tabName);
                    }, 1000);
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                
                let errorMessage = '❌ Upload failed: ';
                if (error.message.includes('Failed to fetch')) {
                    errorMessage += 'Cannot connect to server. Please check if the server is running.';
                } else if (error.message.includes('Authentication')) {
                    errorMessage += error.message;
                    // Just show the message, don't redirect
                } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    errorMessage += 'Please login as admin first.';
                    // Just show the message, don't redirect
                } else if (error.message.includes('413') || error.message.includes('too large')) {
                    errorMessage += 'File is too large (max 100MB).';
                } else {
                    errorMessage += error.message || 'Please try again.';
                }
                
                uploadStatus.textContent = errorMessage;
                uploadStatus.style.background = '#dc3545';
                
                // Reset after error
                setTimeout(() => {
                    fileInput.value = '';
                    fileInfo.textContent = 'No file selected';
                    uploadStatus.textContent = 'Ready to upload';
                    uploadStatus.style.background = '#333';
                    uploadArea.style.borderColor = '#555';
                    uploadArea.style.background = 'linear-gradient(135deg, #1a1a1a, #2a2a2a)';
                }, 3000);
            }
        }
    });
}

// Direct file upload function with custom title
async function uploadFileDirectly(file, tabName, customTitle) {
    // Check admin authentication
    if (!adminToken) {
        throw new Error('Admin authentication required. Please login as admin first.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('semester', getCurrentSemester());
    formData.append('subject', findSubjectKeyByTitle(document.getElementById('modal-subject-title').textContent));
    formData.append('category', tabName); // Changed from 'tab' to 'category'
    formData.append('title', customTitle || file.name); // Use custom title or filename
    formData.append('description', `${customTitle} - ${file.name}`);
    formData.append('type', getFileType(file.name));
    
    try {
        console.log('🚀 Uploading file with admin token:', !!adminToken);
        
        const response = await fetch(`${API_BASE_URL}/content/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: formData
        });
        
        console.log('📡 Upload response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                adminLogout();
                throw new Error('Authentication expired. Please login again.');
            } else if (response.status === 413) {
                throw new Error('File too large. Maximum size is 100MB.');
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        }
        
        const result = await response.json();
        console.log('✅ Upload result:', result);
        
        return result;
    } catch (error) {
        console.error('Direct upload error:', error);
        
        // Provide specific error messages
        if (error.message.includes('Failed to fetch')) {
            return { success: false, message: 'Cannot connect to server. Please check if the server is running on http://localhost:5000' };
        } else if (error.message.includes('Authentication')) {
            return { success: false, message: error.message };
        } else {
            return { success: false, message: error.message };
        }
    }
}

// Helper function to get file type based on extension
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'PDF',
        'doc': 'DOC', 'docx': 'DOC',
        'ppt': 'PPT', 'pptx': 'PPT',
        'txt': 'TEXT',
        'jpg': 'IMAGE', 'jpeg': 'IMAGE', 'png': 'IMAGE', 'gif': 'IMAGE',
        'mp4': 'VIDEO',
        'mp3': 'AUDIO',
        'zip': 'ZIP', 'rar': 'ZIP'
    };
    return typeMap[ext] || 'FILE';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('EduHub loaded successfully!');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Register Service Worker for offline functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }

    // Animation Controller for smooth transitions
    initAnimations();
});

// Smooth Animation System
function initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animate-in')) {
                animateElement(entry.target);
            }
        });
    }, observerOptions);

    // Animate element with stagger effect
    function animateElement(element) {
        if (element.classList.contains('semester-card') || 
            element.classList.contains('resource-card') || 
            element.classList.contains('feature')) {
            
            const siblings = Array.from(element.parentElement.children);
            const index = siblings.indexOf(element);
            
            setTimeout(() => {
                element.classList.add('animate-in');
            }, index * 100);
        } else {
            element.classList.add('animate-in');
        }
    }

    // Observe elements for animation
    function observeElements() {
        const selectors = ['.section-title', '.semester-card', '.resource-card', '.feature', '.content-item'];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => observer.observe(el));
        });
    }

    // Initial observation
    observeElements();

    // Enhanced modal animations
    const originalShowModal = window.showModal;
    const originalCloseModal = window.closeModal;

    if (originalShowModal) {
        window.showModal = function() {
            const modal = document.getElementById('subject-modal');
            if (modal) {
                modal.style.display = 'block';
                setTimeout(() => modal.classList.add('show'), 10);
            }
            originalShowModal.apply(this, arguments);
        };
    }

    if (originalCloseModal) {
        window.closeModal = function() {
            const modal = document.getElementById('subject-modal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.style.display = 'none', 400);
                return;
            }
            originalCloseModal.apply(this, arguments);
        };
    }

    // Re-observe when new content loads
    const originalLoadSubjects = window.loadSubjects;
    if (originalLoadSubjects) {
        window.loadSubjects = function() {
            originalLoadSubjects.apply(this, arguments);
            setTimeout(() => {
                document.querySelectorAll('.subject-card').forEach(el => observer.observe(el));
            }, 100);
        };
    }
}

// Delete content function
async function deleteContent(contentId, tabName, title) {
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`);
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Show loading state
        const contentItem = document.getElementById(`content-item-${contentId}`);
        if (contentItem) {
            contentItem.style.opacity = '0.5';
            contentItem.style.pointerEvents = 'none';
        }
        
        console.log(`🗑️ Deleting content ID: ${contentId}`);
        
        // Try to delete from server
        const response = await fetch(`${API_BASE_URL}/content/${contentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        console.log('Delete response:', result);
        
        if (result.success) {
            // Remove the item from DOM with animation
            if (contentItem) {
                contentItem.style.transform = 'translateX(-100%)';
                contentItem.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    contentItem.remove();
                    
                    // Check if this was the last item, refresh the tab
                    const remainingItems = document.querySelectorAll('.content-item');
                    if (remainingItems.length === 0) {
                        showTab(tabName); // Refresh to show upload interface
                    }
                }, 300);
            }
            
            // Show success notification
            showSuccessNotification(`"${title}" deleted successfully!`);
            
        } else {
            throw new Error(result.message || 'Delete failed');
        }
        
    } catch (error) {
        console.error('Error deleting content:', error);
        
        // Restore the item state
        const contentItem = document.getElementById(`content-item-${contentId}`);
        if (contentItem) {
            contentItem.style.opacity = '1';
            contentItem.style.pointerEvents = 'auto';
        }
        
        // Show more specific error message
        let errorMessage = error.message;
        if (error.message.includes('fetch')) {
            errorMessage = 'Server connection failed. Please check if the server is running.';
        } else if (error.message.includes('Not Found') || error.message.includes('404')) {
            errorMessage = 'File not found. It may have already been deleted.';
        }
        
        alert(`Failed to delete "${title}": ${errorMessage}`);
    }
}

// Scroll to upload section when "Upload New" button is clicked
function scrollToUploadSection(tabName) {
    const uploadSection = document.getElementById(`upload-section-${tabName}`);
    if (uploadSection) {
        // Show the upload section with animation
        uploadSection.style.display = 'block';
        uploadSection.style.opacity = '0';
        uploadSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            uploadSection.style.transition = 'all 0.3s ease';
            uploadSection.style.opacity = '1';
            uploadSection.style.transform = 'translateY(0)';
            
            // Scroll to it
            uploadSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
            
            // Focus on title input
            const titleInput = document.getElementById(`upload-title-${tabName}`);
            if (titleInput) {
                setTimeout(() => {
                    titleInput.focus();
                }, 500);
            }
        }, 10);
    }
}

// Hide upload section when cancel button is clicked
function hideUploadSection(tabName) {
    const uploadSection = document.getElementById(`upload-section-${tabName}`);
    if (uploadSection) {
        uploadSection.style.transition = 'all 0.3s ease';
        uploadSection.style.opacity = '0';
        uploadSection.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            uploadSection.style.display = 'none';
            
            // Clear the form
            const titleInput = document.getElementById(`upload-title-${tabName}`);
            const fileInput = document.getElementById(`simple-file-input-${tabName}`);
            const fileInfo = document.getElementById(`file-info-${tabName}`);
            const uploadStatus = document.getElementById(`upload-status-${tabName}`);
            
            if (titleInput) titleInput.value = '';
            if (fileInput) fileInput.value = '';
            if (fileInfo) fileInfo.textContent = 'No file selected';
            if (uploadStatus) {
                uploadStatus.textContent = 'Ready to upload';
                uploadStatus.style.background = '#333';
                uploadStatus.style.color = '#fff';
            }
        }, 300);
    }
}

// Fallback delete function for JSON storage
async function deleteFromJsonStorage(contentId) {
    try {
        // This would need to be implemented on the server side for JSON storage
        // For now, return a simple response
        return {
            success: true,
            message: 'Content deleted from local storage'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}
