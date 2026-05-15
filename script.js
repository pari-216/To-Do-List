const CONFIG = {
    STORAGE_KEY: 'flowTasks_tasks',
    STORAGE_THEME: 'flowTasks_theme',
    ANIMATIONS_ENABLED: true,
};

const PRIORITIES = {
    high: { label: 'High', order: 0 },
    medium: { label: 'Medium', order: 1 },
    low: { label: 'Low', order: 2 },
};

// ============================================
// APP STATE
// ============================================

const appState = {
    tasks: [],
    currentFilter: 'all',
};

// ============================================
// DOM ELEMENTS
// ============================================

const domElements = {
    taskInput: document.getElementById('task-input'),
    priorityInput: document.getElementById('priority-input'),
    taskList: document.getElementById('task-list'),
    emptyState: document.querySelector('.empty-state'),
    addTaskBtn: document.getElementById('add-task-btn'),
    taskForm: document.getElementById('task-form'),
    clearCompletedBtn: document.getElementById('clear-completed'),
    
    // Statistics
    totalTasksEl: document.getElementById('total-tasks'),
    completedTasksEl: document.getElementById('completed-tasks'),
    pendingTasksEl: document.getElementById('pending-tasks'),
    
    // Progress
    progressFill: document.querySelector('.progress-fill'),
    progressText: document.querySelector('.progress-text'),
    progressBar: document.querySelector('.progress-bar'),
    itemsLeftEl: document.getElementById('items-left'),
    
    // Date & Theme
    todayDateEl: document.getElementById('today-date'),
    themeToggle: document.getElementById('theme-toggle'),
    
    // Filters
    filterButtons: document.querySelectorAll('.filter-btn'),
    
    // Confetti
    canvas: document.getElementById('confetti-canvas'),
    ctx: document.getElementById('confetti-canvas').getContext('2d'),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generates a unique ID for tasks
 */
function generateId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Retrieves tasks from local storage
 */
function loadTasksFromStorage() {
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading tasks from storage:', error);
        return [];
    }
}

/**
 * Saves tasks to local storage
 */
function saveTasksToStorage(tasks) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks to storage:', error);
    }
}

/**
 * Validates task input
 */
function isValidTask(text) {
    return text && text.trim().length > 0 && text.trim().length <= 200;
}

/**
 * Gets task count by filter
 */
function getTaskCount(filter) {
    switch (filter) {
        case 'active':
            return appState.tasks.filter(t => !t.completed).length;
        case 'completed':
            return appState.tasks.filter(t => t.completed).length;
        default:
            return appState.tasks.length;
    }
}

// ============================================
// TASK MANAGEMENT
// ============================================

/**
 * Creates a new task object
 */
function createTask(text, priority = 'medium') {
    return {
        id: generateId(),
        text: text.trim(),
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Adds a new task
 */
function addTask(text, priority = 'medium') {
    if (!isValidTask(text)) return;
    
    const task = createTask(text, priority);
    appState.tasks.unshift(task);
    
    saveTasksToStorage(appState.tasks);
    domElements.taskInput.value = '';
    domElements.priorityInput.value = 'medium';
    
    renderTasks();
    updateStatistics();
    updateProgress();
}

/**
 * Toggles task completion status
 */
function toggleTaskComplete(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage(appState.tasks);
        renderTasks();
        updateStatistics();
        updateProgress();
    }
}

/**
 * Edits a task
 */
function editTask(taskId, newText, newPriority) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (task && isValidTask(newText)) {
        task.text = newText.trim();
        task.priority = newPriority;
        saveTasksToStorage(appState.tasks);
        renderTasks();
        updateStatistics();
    }
}

/**
 * Deletes a task
 */
function deleteTask(taskId) {
    appState.tasks = appState.tasks.filter(t => t.id !== taskId);
    saveTasksToStorage(appState.tasks);
    renderTasks();
    updateStatistics();
    updateProgress();
}

/**
 * Clears all completed tasks
 */
function clearCompletedTasks() {
    appState.tasks = appState.tasks.filter(t => !t.completed);
    saveTasksToStorage(appState.tasks);
    renderTasks();
    updateStatistics();
    updateProgress();
}

/**
 * Gets filtered tasks based on current filter
 */
function getFilteredTasks() {
    switch (appState.currentFilter) {
        case 'active':
            return appState.tasks.filter(t => !t.completed);
        case 'completed':
            return appState.tasks.filter(t => t.completed);
        default:
            return appState.tasks;
    }
}

// ============================================
// RENDERING
// ============================================

/**
 * Creates a task list item element
 */
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = task.completed ? 'completed' : '';
    li.setAttribute('data-task-id', task.id);
    li.setAttribute('role', 'listitem');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => {
        if (CONFIG.ANIMATIONS_ENABLED) {
            li.classList.add('completing');
        }
        toggleTaskComplete(task.id);
    });
    
    // Priority badge
    const priorityBadge = document.createElement('div');
    priorityBadge.className = `priority-badge ${task.priority}`;
    priorityBadge.setAttribute('title', `Priority: ${PRIORITIES[task.priority].label}`);
    priorityBadge.setAttribute('aria-label', `Priority: ${PRIORITIES[task.priority].label}`);
    
    // Task content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'task-content';
    
    const taskText = document.createElement('span');
    taskText.textContent = task.text;
    taskText.setAttribute('title', task.text);
    
    contentWrapper.appendChild(priorityBadge);
    contentWrapper.appendChild(taskText);
    
    // Task buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'task-buttons';
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.type = 'button';
    editBtn.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.disabled = task.completed;
    editBtn.addEventListener('click', () => handleEditTask(task));
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete task: "${task.text}"?`)) {
            deleteTask(task.id);
        }
    });
    
    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(deleteBtn);
    
    li.appendChild(checkbox);
    li.appendChild(contentWrapper);
    li.appendChild(buttonContainer);
    
    return li;
}

/**
 * Renders all tasks to the DOM
 */
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    domElements.taskList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        domElements.emptyState.style.display = 'flex';
    } else {
        domElements.emptyState.style.display = 'none';
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            domElements.taskList.appendChild(taskElement);
        });
    }
}

// ============================================
// STATISTICS & PROGRESS
// ============================================

/**
 * Updates task statistics
 */
function updateStatistics() {
    const total = appState.tasks.length;
    const completed = appState.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    domElements.totalTasksEl.textContent = total;
    domElements.completedTasksEl.textContent = completed;
    domElements.pendingTasksEl.textContent = pending;
}

/**
 * Updates progress bar and related UI
 */
function updateProgress() {
    const total = appState.tasks.length;
    const completed = appState.tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    domElements.progressFill.style.width = percentage + '%';
    domElements.progressText.textContent = `${percentage}% completed`;
    domElements.progressBar.setAttribute('aria-valuenow', percentage);
    
    const remaining = total - completed;
    domElements.itemsLeftEl.textContent = remaining;
    document.getElementById('items-label').textContent = remaining === 1 ? 'task remaining' : 'tasks remaining';
    
    // Trigger confetti on 100% completion
    if (percentage === 100 && total > 0) {
        startConfetti();
    }
}

// ============================================
// EDIT MODE
// ============================================

/**
 * Handles task editing
 */
function handleEditTask(task) {
    const currentText = task.text;
    const currentPriority = task.priority;
    
    const newText = prompt('Edit task:', currentText);
    if (newText === null) return; // User cancelled
    
    if (!isValidTask(newText)) {
        alert('Task must be between 1 and 200 characters.');
        return;
    }
    
    editTask(task.id, newText, currentPriority);
}

// ============================================
// FILTERING
// ============================================

/**
 * Sets the active filter
 */
function setFilter(filter) {
    appState.currentFilter = filter;
    
    domElements.filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    renderTasks();
}

// ============================================
// DATE & TIME
// ============================================

/**
 * Updates today's date display
 */
function updateTodayDate() {
    if (domElements.todayDateEl) {
        const now = new Date();
        const formatted = now.toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
        domElements.todayDateEl.textContent = formatted;
    }
}

// ============================================
// THEME MANAGEMENT
// ============================================

/**
 * Sets the theme
 */
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
    
    const icon = domElements.themeToggle.querySelector('i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
    }
    
    localStorage.setItem(CONFIG.STORAGE_THEME, theme);
}

/**
 * Initializes theme based on user preference or saved setting
 */
function initializeTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_THEME);
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
}

// ============================================
// CONFETTI ANIMATION
// ============================================

let confettiParticles = [];

/**
 * Initializes confetti canvas
 */
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    domElements.canvas.width = window.innerWidth * dpr;
    domElements.canvas.height = window.innerHeight * dpr;
    domElements.canvas.style.width = window.innerWidth + 'px';
    domElements.canvas.style.height = window.innerHeight + 'px';
    domElements.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Starts confetti animation
 */
function startConfetti() {
    confettiParticles = Array.from({ length: 140 }, () => ({
        x: Math.random() * domElements.canvas.width,
        y: Math.random() * domElements.canvas.height,
        r: Math.random() * 6 + 4,
        dx: Math.random() * 4 - 2,
        dy: Math.random() * 5 + 2,
    }));
    
    requestAnimationFrame(drawConfetti);
    setTimeout(() => confettiParticles = [], 3000);
}

/**
 * Draws confetti particles
 */
function drawConfetti() {
    domElements.ctx.clearRect(0, 0, domElements.canvas.width, domElements.canvas.height);
    
    confettiParticles.forEach(p => {
        domElements.ctx.beginPath();
        domElements.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        domElements.ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 70%)`;
        domElements.ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
    });
    
    if (confettiParticles.length > 0) {
        requestAnimationFrame(drawConfetti);
    }
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

/**
 * Handles keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter to add task
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (domElements.taskInput === document.activeElement) {
            event.preventDefault();
            domElements.taskForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape to clear input
    if (event.key === 'Escape' && document.activeElement === domElements.taskInput) {
        domElements.taskInput.value = '';
        domElements.priorityInput.value = 'medium';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Initializes all event listeners
 */
function initializeEventListeners() {
    // Task form submission
    domElements.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(domElements.taskInput.value, domElements.priorityInput.value);
        renderTasks();
        updateStatistics();
        updateProgress();
    });
    
    // Clear completed button
    domElements.clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // Filter buttons
    domElements.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });
    
    // Theme toggle
    domElements.themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
    });
    
    // Canvas resize
    window.addEventListener('resize', resizeCanvas);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Main initialization function
 */
function initializeApp() {
    resizeCanvas();
    initializeTheme();
    updateTodayDate();
    
    // Load tasks from storage
    appState.tasks = loadTasksFromStorage();
    
    // Initial render
    renderTasks();
    updateStatistics();
    updateProgress();
    
    // Setup event listeners
    initializeEventListeners();
    
    // Set initial filter
    setFilter('all');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
