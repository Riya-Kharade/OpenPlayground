// Task Management System
class TaskDashboard {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentEditId = null;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDashboard();
        this.applyTheme();
        this.updateCurrentDate();
    }

    // Load tasks from localStorage
    loadTasks() {
        const saved = localStorage.getItem('tasks');
        return saved ? JSON.parse(saved) : [];
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    // Event Listeners
    setupEventListeners() {
        // Modal controls
        const modal = document.getElementById('taskModal');
        const newTaskBtns = document.querySelectorAll('#newTaskBtn, #newTaskBtn2');
        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const taskForm = document.getElementById('taskForm');

        newTaskBtns.forEach(btn => {
            btn.addEventListener('click', () => this.openModal());
        });

        closeModal.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchSection(e.target.closest('.nav-item')));
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('darkModeToggle').addEventListener('change', () => this.toggleTheme());

        // Filters
        document.getElementById('filterPriority').addEventListener('change', () => this.renderDashboard());
        document.getElementById('filterStatus').addEventListener('change', () => this.renderDashboard());

        // Search
        document.getElementById('searchInput').addEventListener('input', () => this.renderAllTasks());

        // Settings
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());
        document.getElementById('notificationsToggle').addEventListener('change', (e) => {
            localStorage.setItem('notifications', e.target.checked);
        });
    }

    // Modal controls
    openModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');

        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            this.currentEditId = taskId;
            document.querySelector('.modal-header h2').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskDueDate').value = task.dueDate;
            document.getElementById('taskDueTime').value = task.dueTime || '';
            document.getElementById('taskEstimatedTime').value = task.estimatedTime || '';
        } else {
            this.currentEditId = null;
            form.reset();
            document.querySelector('.modal-header h2').textContent = 'Add New Task';
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('taskDueDate').value = today;
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('taskModal').classList.remove('active');
        this.currentEditId = null;
    }

    // Handle form submission
    handleTaskSubmit(e) {
        e.preventDefault();

        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value,
            dueDate: document.getElementById('taskDueDate').value,
            dueTime: document.getElementById('taskDueTime').value,
            estimatedTime: parseInt(document.getElementById('taskEstimatedTime').value) || null
        };

        if (this.currentEditId) {
            // Edit existing task
            const task = this.tasks.find(t => t.id === this.currentEditId);
            Object.assign(task, taskData);
            this.showNotification('Task updated successfully!');
        } else {
            // Create new task
            const newTask = {
                id: Date.now(),
                ...taskData,
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            this.tasks.push(newTask);
            this.showNotification('Task created successfully!');
        }

        this.saveTasks();
        this.renderDashboard();
        this.renderAllTasks();
        this.closeModal();
    }

    // Delete task
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderDashboard();
            this.renderAllTasks();
            this.showNotification('Task deleted successfully!');
        }
    }

    // Toggle task completion
    toggleTaskCompletion(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderDashboard();
            this.renderAllTasks();
            this.showNotification(task.completed ? 'Great job! Task completed!' : 'Task marked as pending');
        }
    }

    // Section Navigation
    switchSection(navItem) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        navItem.classList.add('active');

        const sectionId = navItem.dataset.section;
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        if (sectionId === 'stats') {
            this.renderAnalytics();
        }
    }

    // Theme management
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyTheme();
    }

    applyTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').innerHTML = '<i class="ri-sun-line"></i>';
            document.getElementById('darkModeToggle').checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('themeToggle').innerHTML = '<i class="ri-moon-line"></i>';
            document.getElementById('darkModeToggle').checked = false;
        }
    }

    // Render Dashboard
    renderDashboard() {
        this.updateStats();
        this.updateProgress();
        this.renderTodaysTasks();
    }

    // Update statistics
    updateStats() {
        const today = new Date().toDateString();
        const urgent = this.tasks.filter(t => !t.completed && t.priority === 'high');
        const inProgress = this.tasks.filter(t => !t.completed);
        const completedToday = this.tasks.filter(t => t.completed && new Date(t.completedAt).toDateString() === today);
        const dueSoon = this.tasks.filter(t => {
            if (t.completed) return false;
            const dueDate = new Date(t.dueDate);
            const today = new Date();
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 3;
        });

        document.getElementById('totalTasksCount').textContent = this.tasks.length;
        document.getElementById('completedTasksCount').textContent = this.tasks.filter(t => t.completed).length;
        document.getElementById('urgentCount').textContent = urgent.length;
        document.getElementById('inProgressCount').textContent = inProgress.length;
        document.getElementById('completedTodayCount').textContent = completedToday.length;
        document.getElementById('dueSoonCount').textContent = dueSoon.length;
    }

    // Update progress bar
    updateProgress() {
        const today = new Date().toDateString();
        const todaysTasks = this.tasks.filter(t => 
            new Date(t.dueDate).toDateString() === today
        );
        const completedToday = todaysTasks.filter(t => t.completed);

        const percentage = todaysTasks.length === 0 ? 0 : Math.round((completedToday.length / todaysTasks.length) * 100);
        document.getElementById('progressFill').style.width = percentage + '%';
        document.getElementById('progressText').textContent = `${completedToday.length} of ${todaysTasks.length} tasks completed`;
    }

    // Render today's tasks
    renderTodaysTasks() {
        const today = new Date().toDateString();
        const priorityFilter = document.getElementById('filterPriority').value;
        const statusFilter = document.getElementById('filterStatus').value;

        let todaysTasks = this.tasks.filter(t => 
            new Date(t.dueDate).toDateString() === today
        );

        if (priorityFilter !== 'all') {
            todaysTasks = todaysTasks.filter(t => t.priority === priorityFilter);
        }

        if (statusFilter !== 'all') {
            if (statusFilter === 'completed') {
                todaysTasks = todaysTasks.filter(t => t.completed);
            } else {
                todaysTasks = todaysTasks.filter(t => !t.completed);
            }
        }

        todaysTasks.sort((a, b) => {
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        const taskList = document.getElementById('dashboardTaskList');
        if (todaysTasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state"><i class="ri-inbox-line"></i><p>No tasks for today</p></div>';
        } else {
            taskList.innerHTML = todaysTasks.map(task => this.createTaskElement(task)).join('');
            this.attachTaskEventListeners();
        }
    }

    // Render all tasks
    renderAllTasks() {
        let tasks = [...this.tasks];
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();

        if (searchQuery) {
            tasks = tasks.filter(t => 
                t.title.toLowerCase().includes(searchQuery) ||
                t.description.toLowerCase().includes(searchQuery)
            );
        }

        tasks.sort((a, b) => {
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const taskList = document.getElementById('allTaskList');
        if (tasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state"><i class="ri-inbox-line"></i><p>No tasks found</p></div>';
        } else {
            taskList.innerHTML = tasks.map(task => this.createTaskElement(task)).join('');
            this.attachTaskEventListeners();
        }
    }

    // Create task element
    createTaskElement(task) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const isOverdue = dueDate < today && !task.completed;
        const dueDateText = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="dashboard.toggleTaskCompletion(${task.id})">
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
                        <span class="task-category">${task.category}</span>
                        <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                            <i class="ri-calendar-line"></i> ${dueDateText}
                        </span>
                        ${task.estimatedTime ? `<span><i class="ri-time-line"></i> ${task.estimatedTime}m</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn" onclick="dashboard.openModal(${task.id})" title="Edit">
                        <i class="ri-edit-line"></i>
                    </button>
                    <button class="task-btn delete" onclick="dashboard.deleteTask(${task.id})" title="Delete">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Render Analytics
    renderAnalytics() {
        this.updateAnalytics();
        this.renderWeeklyChart();
        this.generateInsights();
    }

    // Update analytics
    updateAnalytics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        document.getElementById('completionPercentage').textContent = percentage + '%';

        // Priority breakdown
        const high = this.tasks.filter(t => t.priority === 'high').length;
        const medium = this.tasks.filter(t => t.priority === 'medium').length;
        const low = this.tasks.filter(t => t.priority === 'low').length;

        document.getElementById('highPriorityStats').textContent = high;
        document.getElementById('mediumPriorityStats').textContent = medium;
        document.getElementById('lowPriorityStats').textContent = low;

        // Update streak
        this.updateStreak();
    }

    // Render weekly chart
    renderWeeklyChart() {
        const weeklyChart = document.getElementById('weeklyChart');
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let html = '';

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();

            const completed = this.tasks.filter(t => 
                t.completed && new Date(t.completedAt).toDateString() === dateString
            ).length;

            const maxValue = Math.max(...Array.from({length: 7}, (_, idx) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - idx));
                return this.tasks.filter(t => 
                    t.completed && new Date(t.completedAt).toDateString() === d.toDateString()
                ).length;
            }), 1);

            const height = maxValue === 0 ? 20 : (completed / maxValue) * 100;

            html += `<div class="bar" style="height: ${Math.max(height, 20)}%" data-value="${completed}" 
                          title="${days[date.getDay()]} - ${completed} tasks"></div>`;
        }

        weeklyChart.innerHTML = html;
    }

    // Update streak
    updateStreak() {
        let streak = 0;
        let currentDate = new Date();

        while (true) {
            const dateString = currentDate.toDateString();
            const completedToday = this.tasks.filter(t => 
                t.completed && new Date(t.completedAt).toDateString() === dateString &&
                this.tasks.filter(t => new Date(t.dueDate).toDateString() === dateString).length > 0
            ).length;

            const totalToday = this.tasks.filter(t => 
                new Date(t.dueDate).toDateString() === dateString
            ).length;

            if (completedToday === 0 || totalToday === 0) break;

            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        document.getElementById('streakNumber').textContent = streak;
        const message = streak === 0 ? 'Start your streak!' : 
                       streak === 1 ? 'Keep it going!' :
                       streak >= 7 ? '🔥 Amazing streak!' : 'Keep it up!';
        document.getElementById('streakMessage').textContent = message;
    }

    // Generate insights
    generateInsights() {
        const insights = [];
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const highPriority = this.tasks.filter(t => !t.completed && t.priority === 'high').length;

        if (total === 0) {
            insights.push('Create your first task to get started!');
        } else {
            if (completed === total) {
                insights.push('🎉 All tasks completed! Great work!');
            } else if ((completed / total) >= 0.75) {
                insights.push('📈 You\'ve completed 75% of your tasks. Almost there!');
            } else if ((completed / total) >= 0.5) {
                insights.push('⚡ You\'ve completed 50% of your tasks. Keep pushing!');
            }

            if (highPriority > 0) {
                insights.push(`⚠️ You have ${highPriority} high-priority task${highPriority > 1 ? 's' : ''}. Focus on these first!`);
            }

            const overdueTasks = this.tasks.filter(t => {
                if (t.completed) return false;
                const dueDate = new Date(t.dueDate);
                return dueDate < new Date();
            }).length;

            if (overdueTasks > 0) {
                insights.push(`⏰ You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}. Consider completing them soon!`);
            }

            const avgTimePerTask = this.tasks
                .filter(t => t.estimatedTime)
                .reduce((sum, t) => sum + t.estimatedTime, 0) / 
                (this.tasks.filter(t => t.estimatedTime).length || 1);
            
            if (avgTimePerTask > 0) {
                insights.push(`⏱️ Average task duration: ${Math.round(avgTimePerTask)} minutes`);
            }
        }

        const insightsList = document.getElementById('insightsList');
        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <i class="ri-lightbulb-line"></i>
                <p>${insight}</p>
            </div>
        `).join('');
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification show ${type}`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    updateCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('en-US', options);
        document.getElementById('currentDate').textContent = today;
    }

    // Export data
    exportData() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        this.showNotification('Data exported successfully!');
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to delete ALL tasks? This action cannot be undone.')) {
            this.tasks = [];
            this.saveTasks();
            this.renderDashboard();
            this.renderAllTasks();
            this.showNotification('All data cleared!', 'warning');
        }
    }
}

// Initialize dashboard
const dashboard = new TaskDashboard();

// Set notifications preference default
if (!localStorage.getItem('notifications')) {
    localStorage.setItem('notifications', 'true');
}
