/**
 * SundAI Frontend Application
 * Clean, modular code with proper backend database connection
 */

// ============================================================================
// APPLICATION STATE
// ============================================================================
const AppState = {
    currentView: 'dashboard',
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    editingId: null,
    isLoading: false,
    aiMode: 'mcp' // 'mcp' or 'rag'
};

// Local data cache (NOT the database API - that's window.db)
const DataCache = {
    patients: [],
    appointments: [],
    deadlines: [],
    inventory: []
};

// ============================================================================
// DATABASE API WRAPPER
// ============================================================================
const Database = {
    // Check if database API is available
    isConnected() {
        return window.db && typeof window.db.loadAll === 'function';
    },

    // Load all data
    async loadAll() {
        if (!this.isConnected()) {
            console.warn('Database not connected, using empty data');
            return { patients: [], appointments: [], deadlines: [], inventory: [] };
        }
        try {
            const result = await window.db.loadAll();
            if (result && result.success !== false) {
                return result;
            }
            return { patients: [], appointments: [], deadlines: [], inventory: [] };
        } catch (error) {
            console.error('Failed to load data:', error);
            return { patients: [], appointments: [], deadlines: [], inventory: [] };
        }
    },

    // Patients
    async getPatients() {
        if (!this.isConnected()) return [];
        try {
            const result = await window.db.getAllPatients(1000, 0);
            return result?.data || result?.patients || [];
        } catch (error) {
            console.error('Failed to get patients:', error);
            return [];
        }
    },

    async createPatient(patient) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.createPatient(patient);
    },

    async updatePatient(id, updates) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.updatePatient(id, updates);
    },

    async deletePatient(id) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.deletePatient(id);
    },

    async searchPatients(query) {
        if (!this.isConnected()) return [];
        try {
            const result = await window.db.searchPatients(query, 20, 0);
            return result?.data || result?.patients || [];
        } catch (error) {
            console.error('Failed to search patients:', error);
            return [];
        }
    },

    // Appointments
    async getAppointments() {
        if (!this.isConnected()) return [];
        try {
            const result = await window.db.getAllAppointments(1000, 0);
            return result?.data || result?.appointments || [];
        } catch (error) {
            console.error('Failed to get appointments:', error);
            return [];
        }
    },

    async createAppointment(appointment) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.createAppointment(appointment);
    },

    async updateAppointment(id, updates) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.updateAppointment(id, updates);
    },

    async deleteAppointment(id) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.deleteAppointment(id);
    },

    // Deadlines
    async getDeadlines() {
        if (!this.isConnected()) return [];
        try {
            const result = await window.db.getAllDeadlines(1000, 0);
            return result?.data || result?.deadlines || [];
        } catch (error) {
            console.error('Failed to get deadlines:', error);
            return [];
        }
    },

    async createDeadline(deadline) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.createDeadline(deadline);
    },

    async updateDeadline(id, updates) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.updateDeadline(id, updates);
    },

    async deleteDeadline(id) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.deleteDeadline(id);
    },

    // Inventory
    async getInventory() {
        if (!this.isConnected()) return [];
        try {
            console.log('📦 [FRONTEND] Getting inventory...');
            const result = await window.db.getAllInventory(1000, 0);
            console.log('📦 [FRONTEND] Inventory result:', result);
            const inventory = result?.data || result?.inventory || [];
            console.log(`📦 [FRONTEND] Returning ${inventory.length} items`);
            return inventory;
        } catch (error) {
            console.error('❌ [FRONTEND] Failed to get inventory:', error);
            return [];
        }
    },

    async createInventoryItem(item) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.createInventoryItem(item);
    },

    async updateInventoryItem(id, updates) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.updateInventoryItem(id, updates);
    },

    async deleteInventoryItem(id) {
        if (!this.isConnected()) throw new Error('Database not connected');
        return await window.db.deleteInventoryItem(id);
    },

    async getLowStock() {
        if (!this.isConnected()) return [];
        try {
            const result = await window.db.getLowStock();
            return result?.data || [];
        } catch (error) {
            console.error('Failed to get low stock:', error);
            return [];
        }
    }
};

// ============================================================================
// UI UTILITIES
// ============================================================================
const UI = {
    // Show toast notification
    toast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    // Show/hide modal
    showModal(modalId) {
        document.getElementById('modal-overlay').classList.add('show');
        document.getElementById(modalId).classList.add('show');
    },

    hideModals() {
        document.getElementById('modal-overlay').classList.remove('show');
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
        AppState.editingId = null;
    },

    // Format date for display
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    // Format date for input
    formatDateForInput(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    },

    // Update connection status
    updateConnectionStatus(connected) {
        const dot = document.getElementById('connection-status');
        if (dot) {
            dot.classList.toggle('connected', connected);
            dot.title = connected ? 'Database Connected' : 'Database Disconnected';
        }
    }
};

// ============================================================================
// VIEW NAVIGATION
// ============================================================================
function switchView(viewName) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Show selected view
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === `${viewName}-view`);
    });

    AppState.currentView = viewName;

    // Load view data
    switch(viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'patients':
            loadPatients();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'deadlines':
            loadDeadlines();
            break;
        case 'inventory':
            loadInventory();
            break;
    }
}

// ============================================================================
// DASHBOARD
// ============================================================================
async function loadDashboard() {
    await Promise.all([
        loadStats(),
        renderCalendar(),
        loadTodaySchedule()
    ]);
}

async function loadStats() {
    try {
        const [patients, appointments, deadlines, lowStock] = await Promise.all([
            Database.getPatients(),
            Database.getAppointments(),
            Database.getDeadlines(),
            Database.getLowStock()
        ]);

        DataCache.patients = patients;
        DataCache.appointments = appointments;
        DataCache.deadlines = deadlines;

        // Update stats
        document.getElementById('total-patients').textContent = patients.length;
        
        // Today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = appointments.filter(a => a.date === today);
        document.getElementById('today-appointments').textContent = todayAppts.length;

        // Pending deadlines (future or today)
        const pendingDeadlines = deadlines.filter(d => {
            const deadlineDate = new Date(d.date || d.dueDate);
            return deadlineDate >= new Date().setHours(0,0,0,0);
        });
        document.getElementById('pending-deadlines').textContent = pendingDeadlines.length;

        // Low stock
        document.getElementById('low-stock').textContent = lowStock.length;

        UI.updateConnectionStatus(true);
    } catch (error) {
        console.error('Failed to load stats:', error);
        UI.updateConnectionStatus(false);
    }
}

async function loadTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    showDateSchedule(today, true);
}

function showDateSchedule(date, isToday = false) {
    selectedCalendarDate = date;
    
    // Update title
    const titleEl = document.getElementById('schedule-title');
    const backBtn = document.getElementById('back-to-today-btn');
    
    if (isToday) {
        titleEl.textContent = "Today's Schedule";
        backBtn.style.display = 'none';
    } else {
        titleEl.textContent = UI.formatDate(date);
        backBtn.style.display = 'block';
    }
    
    // Filter appointments for this date
    const dateAppts = DataCache.appointments
        .filter(a => a.date === date)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    
    // Filter deadlines for this date
    const dateDeadlines = DataCache.deadlines.filter(d => (d.date || d.dueDate) === date);
    
    // Render appointments
    const apptsContainer = document.getElementById('appointments-list');
    if (dateAppts.length === 0) {
        apptsContainer.innerHTML = '<p class="empty-state">No appointments</p>';
    } else {
        apptsContainer.innerHTML = dateAppts.map(appt => `
            <div class="schedule-item">
                <span class="schedule-time">${appt.time || '--:--'}</span>
                <div class="schedule-info">
                    <div class="schedule-patient">${appt.patientName || 'Unknown Patient'}</div>
                    <div class="schedule-type">${appt.type || 'Appointment'}${appt.notes ? ' • ' + appt.notes.substring(0, 20) : ''}</div>
                </div>
                <div class="schedule-actions-inline">
                    <button class="btn-icon-sm" onclick="editAppointment(${appt.id})" title="Edit">✏️</button>
                    <button class="btn-icon-sm" onclick="deleteAppointmentAndRefresh(${appt.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    // Render deadlines
    const deadlinesContainer = document.getElementById('deadlines-list');
    if (dateDeadlines.length === 0) {
        deadlinesContainer.innerHTML = '<p class="empty-state">No deadlines</p>';
    } else {
        deadlinesContainer.innerHTML = dateDeadlines.map(d => `
            <div class="schedule-item deadline ${d.priority === 'high' ? 'high-priority' : ''}">
                <div class="schedule-info">
                    <div class="schedule-patient">${d.title || 'Untitled'}</div>
                    <div class="schedule-type">${d.priority || 'medium'} priority</div>
                </div>
                <div class="schedule-actions-inline">
                    <button class="btn-icon-sm" onclick="editDeadline(${d.id})" title="Edit">✏️</button>
                    <button class="btn-icon-sm" onclick="deleteDeadlineAndRefresh(${d.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    // Highlight selected day in calendar
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
        if (day.dataset.date === date) {
            day.classList.add('selected');
        }
    });
}

// Delete and refresh the schedule panel
async function deleteAppointmentAndRefresh(id) {
    if (!confirm('Delete this appointment?')) return;
    try {
        await Database.deleteAppointment(id);
        UI.toast('Appointment deleted');
        await loadStats();
        showDateSchedule(selectedCalendarDate);
        renderCalendar();
    } catch (error) {
        UI.toast('Failed to delete: ' + error.message, 'error');
    }
}

async function deleteDeadlineAndRefresh(id) {
    if (!confirm('Delete this deadline?')) return;
    try {
        await Database.deleteDeadline(id);
        UI.toast('Deadline deleted');
        await loadStats();
        showDateSchedule(selectedCalendarDate);
        renderCalendar();
    } catch (error) {
        UI.toast('Failed to delete: ' + error.message, 'error');
    }
}

function backToToday() {
    const today = new Date().toISOString().split('T')[0];
    showDateSchedule(today, true);
}

// ============================================================================
// CALENDAR
// ============================================================================
function renderCalendar() {
    const container = document.getElementById('calendar-days');
    const monthYearEl = document.getElementById('calendar-month-year');
    
    const year = AppState.currentYear;
    const month = AppState.currentMonth;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const todayDate = today.getDate();

    // Get dates with events and count them
    const eventCounts = {};
    DataCache.appointments.forEach(a => {
        if (a.date) {
            const d = new Date(a.date);
            if (d.getMonth() === month && d.getFullYear() === year) {
                const day = d.getDate();
                eventCounts[day] = (eventCounts[day] || 0) + 1;
            }
        }
    });
    DataCache.deadlines.forEach(d => {
        const date = new Date(d.date || d.dueDate);
        if (date.getMonth() === month && date.getFullYear() === year) {
            const day = date.getDate();
            eventCounts[day] = (eventCounts[day] || 0) + 1;
        }
    });

    let html = '';

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === todayDate;
        const eventCount = eventCounts[day] || 0;
        const hasEvents = eventCount > 0;
        const classes = ['calendar-day'];
        if (isToday) classes.push('today');
        if (hasEvents) classes.push('has-events');
        
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const countBadge = eventCount > 1 ? `<span class="event-count">${eventCount}</span>` : '';
        html += `<div class="${classes.join(' ')}" data-date="${dateStr}">${day}${countBadge}</div>`;
    }

    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
        day.addEventListener('click', () => {
            const date = day.dataset.date;
            showDateDetails(date);
        });
    });
}

// Store selected date for adding events
let selectedCalendarDate = null;

function showDateDetails(date) {
    // Show the date's schedule in the side panel
    const today = new Date().toISOString().split('T')[0];
    showDateSchedule(date, date === today);
}

// Add appointment for selected date
function addAppointmentForDate() {
    UI.hideModals();
    showAppointmentModal();
    // Pre-fill the date
    if (selectedCalendarDate) {
        document.getElementById('appointment-date').value = selectedCalendarDate;
    }
}

// Add deadline for selected date
function addDeadlineForDate() {
    UI.hideModals();
    showDeadlineModal();
    // Pre-fill the date
    if (selectedCalendarDate) {
        document.getElementById('deadline-date').value = selectedCalendarDate;
    }
}

function prevMonth() {
    AppState.currentMonth--;
    if (AppState.currentMonth < 0) {
        AppState.currentMonth = 11;
        AppState.currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    AppState.currentMonth++;
    if (AppState.currentMonth > 11) {
        AppState.currentMonth = 0;
        AppState.currentYear++;
    }
    renderCalendar();
}

// ============================================================================
// PATIENTS
// ============================================================================
async function loadPatients() {
    const tbody = document.getElementById('patients-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading...</td></tr>';

    try {
        const patients = await Database.getPatients();
        DataCache.patients = patients;

        if (patients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No patients found. Click "Add Patient" to create one.</td></tr>';
            return;
        }

        tbody.innerHTML = patients.map(p => `
            <tr>
                <td><strong>#${p.patientNumber || p.patient_number || p.id}</strong></td>
                <td><strong>${p.name || '-'}</strong></td>
                <td>${UI.formatDate(p.dob || p.dateOfBirth)}</td>
                <td>${p.phone || p.contactPhone || '-'}</td>
                <td>${UI.formatDate(p.lastVisit)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editPatient(${p.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deletePatient(${p.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load patients:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load patients</td></tr>';
    }
}

function showPatientModal(patient = null) {
    const form = document.getElementById('patient-form');
    const title = document.getElementById('patient-modal-title');
    
    form.reset();
    
    if (patient) {
        title.textContent = 'Edit Patient';
        AppState.editingId = patient.id;
        document.getElementById('patient-name').value = patient.name || '';
        document.getElementById('patient-dob').value = UI.formatDateForInput(patient.dob || patient.dateOfBirth);
        document.getElementById('patient-phone').value = patient.phone || patient.contactPhone || '';
        document.getElementById('patient-email').value = patient.email || '';
        document.getElementById('patient-address').value = patient.address || '';
    } else {
        title.textContent = 'Add New Patient';
        AppState.editingId = null;
    }
    
    UI.showModal('patient-modal');
}

async function savePatient(event) {
    event.preventDefault();
    
    const patient = {
        name: document.getElementById('patient-name').value.trim(),
        dob: document.getElementById('patient-dob').value,
        phone: document.getElementById('patient-phone').value.trim(),
        email: document.getElementById('patient-email').value.trim(),
        address: document.getElementById('patient-address').value.trim()
    };

    console.log('💾 [FRONTEND] savePatient called with:', patient);

    try {
        if (AppState.editingId) {
            console.log('   Updating patient:', AppState.editingId);
            await Database.updatePatient(AppState.editingId, patient);
            UI.toast('Patient updated successfully');
        } else {
            console.log('   Creating new patient...');
            const result = await Database.createPatient(patient);
            console.log('   ✅ Patient created, result:', result);
            UI.toast('Patient created successfully');
        }
        UI.hideModals();
        loadPatients();
        loadStats();
    } catch (error) {
        console.error('❌ [FRONTEND] Failed to save patient:', error);
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        
        // Show detailed error
        const errorMsg = error.message || error.toString();
        UI.toast('Failed to save patient: ' + errorMsg, 'error');
        
        // Also log to console for debugging
        if (error.message && error.message.includes('No handler registered')) {
            console.error('⚠️ Handler registration issue detected!');
            console.error('   Testing handler...');
            try {
                const testResult = await window.db.testHandler();
                console.log('   Test handler result:', testResult);
            } catch (testError) {
                console.error('   ❌ Test handler also failed:', testError);
            }
        }
    }
}

async function editPatient(id) {
    const patient = DataCache.patients.find(p => p.id === id);
    if (patient) {
        showPatientModal(patient);
    }
}

async function deletePatient(id) {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    
    try {
        await Database.deletePatient(id);
        UI.toast('Patient deleted');
        loadPatients();
        loadStats();
    } catch (error) {
        console.error('Failed to delete patient:', error);
        UI.toast('Failed to delete patient', 'error');
    }
}

// ============================================================================
// APPOINTMENTS
// ============================================================================
async function loadAppointments() {
    const tbody = document.getElementById('appointments-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading...</td></tr>';

    try {
        const appointments = await Database.getAppointments();
        DataCache.appointments = appointments;

        if (appointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No appointments found.</td></tr>';
            return;
        }

        // Sort by date and time
        appointments.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
            const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
            return dateB - dateA;
        });

        tbody.innerHTML = appointments.map(a => `
            <tr>
                <td>${UI.formatDate(a.date)}</td>
                <td>${a.time || '-'}</td>
                <td>${a.patientName || '-'}</td>
                <td>${a.type || '-'}</td>
                <td><span class="status-badge ${(a.status || 'scheduled').toLowerCase()}">${a.status || 'Scheduled'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editAppointment(${a.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAppointment(${a.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load appointments:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load appointments</td></tr>';
    }
}

function showAppointmentModal(appointment = null) {
    const form = document.getElementById('appointment-form');
    const title = document.getElementById('appointment-modal-title');
    
    form.reset();
    
    if (appointment) {
        title.textContent = 'Edit Appointment';
        AppState.editingId = appointment.id;
        document.getElementById('appointment-patient').value = appointment.patientName || '';
        document.getElementById('appointment-patient-id').value = appointment.patientId || '';
        document.getElementById('appointment-date').value = UI.formatDateForInput(appointment.date);
        document.getElementById('appointment-time').value = appointment.time || '';
        document.getElementById('appointment-type').value = appointment.type || 'checkup';
        document.getElementById('appointment-duration').value = appointment.duration || 30;
        document.getElementById('appointment-notes').value = appointment.notes || '';
    } else {
        title.textContent = 'New Appointment';
        AppState.editingId = null;
        // Set default date to today
        document.getElementById('appointment-date').value = new Date().toISOString().split('T')[0];
    }
    
    UI.showModal('appointment-modal');
}

async function saveAppointment(event) {
    event.preventDefault();
    
    const appointment = {
        patientName: document.getElementById('appointment-patient').value.trim(),
        patientId: document.getElementById('appointment-patient-id').value || null,
        date: document.getElementById('appointment-date').value,
        time: document.getElementById('appointment-time').value,
        type: document.getElementById('appointment-type').value,
        duration: parseInt(document.getElementById('appointment-duration').value) || 30,
        notes: document.getElementById('appointment-notes').value.trim(),
        status: 'scheduled'
    };

    try {
        if (AppState.editingId) {
            await Database.updateAppointment(AppState.editingId, appointment);
            UI.toast('Appointment updated');
        } else {
            await Database.createAppointment(appointment);
            UI.toast('Appointment created');
        }
        UI.hideModals();
        loadAppointments();
        loadDashboard();
    } catch (error) {
        console.error('Failed to save appointment:', error);
        UI.toast('Failed to save appointment: ' + error.message, 'error');
    }
}

async function editAppointment(id) {
    const appointment = DataCache.appointments.find(a => a.id === id);
    if (appointment) {
        showAppointmentModal(appointment);
    }
}

async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    
    try {
        await Database.deleteAppointment(id);
        UI.toast('Appointment deleted');
        loadAppointments();
        loadDashboard();
    } catch (error) {
        console.error('Failed to delete appointment:', error);
        UI.toast('Failed to delete appointment', 'error');
    }
}

// ============================================================================
// DEADLINES
// ============================================================================
async function loadDeadlines() {
    const tbody = document.getElementById('deadlines-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading...</td></tr>';

    try {
        const deadlines = await Database.getDeadlines();
        DataCache.deadlines = deadlines;

        if (deadlines.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No deadlines found.</td></tr>';
            return;
        }

        // Sort by date
        deadlines.sort((a, b) => new Date(a.date || a.dueDate) - new Date(b.date || b.dueDate));

        tbody.innerHTML = deadlines.map(d => `
            <tr>
                <td>${UI.formatDate(d.date || d.dueDate)}</td>
                <td><strong>${d.title || '-'}</strong></td>
                <td>${d.description || '-'}</td>
                <td><span class="status-badge ${(d.priority || 'medium').toLowerCase()}">${d.priority || 'Medium'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="editDeadline(${d.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteDeadline(${d.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load deadlines:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Failed to load deadlines</td></tr>';
    }
}

function showDeadlineModal(deadline = null) {
    const form = document.getElementById('deadline-form');
    const title = document.getElementById('deadline-modal-title');
    
    form.reset();
    
    if (deadline) {
        title.textContent = 'Edit Deadline';
        AppState.editingId = deadline.id;
        document.getElementById('deadline-title').value = deadline.title || '';
        document.getElementById('deadline-date').value = UI.formatDateForInput(deadline.date || deadline.dueDate);
        document.getElementById('deadline-priority').value = deadline.priority || 'medium';
        document.getElementById('deadline-description').value = deadline.description || '';
    } else {
        title.textContent = 'New Deadline';
        AppState.editingId = null;
    }
    
    UI.showModal('deadline-modal');
}

async function saveDeadline(event) {
    event.preventDefault();
    
    const deadline = {
        title: document.getElementById('deadline-title').value.trim(),
        date: document.getElementById('deadline-date').value,
        dueDate: document.getElementById('deadline-date').value,
        priority: document.getElementById('deadline-priority').value,
        description: document.getElementById('deadline-description').value.trim()
    };

    try {
        if (AppState.editingId) {
            await Database.updateDeadline(AppState.editingId, deadline);
            UI.toast('Deadline updated');
        } else {
            await Database.createDeadline(deadline);
            UI.toast('Deadline created');
        }
        UI.hideModals();
        loadDeadlines();
        loadDashboard();
    } catch (error) {
        console.error('Failed to save deadline:', error);
        UI.toast('Failed to save deadline: ' + error.message, 'error');
    }
}

async function editDeadline(id) {
    const deadline = DataCache.deadlines.find(d => d.id === id);
    if (deadline) {
        showDeadlineModal(deadline);
    }
}

async function deleteDeadline(id) {
    if (!confirm('Are you sure you want to delete this deadline?')) return;
    
    try {
        await Database.deleteDeadline(id);
        UI.toast('Deadline deleted');
        loadDeadlines();
        loadDashboard();
    } catch (error) {
        console.error('Failed to delete deadline:', error);
        UI.toast('Failed to delete deadline', 'error');
    }
}

// ============================================================================
// INVENTORY
// ============================================================================
async function loadInventory() {
    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading...</td></tr>';

    try {
        console.log('📦 [FRONTEND] loadInventory called');
        const inventory = await Database.getInventory();
        console.log('📦 [FRONTEND] Got inventory:', inventory);
        console.log('📦 [FRONTEND] Inventory length:', inventory.length);
        DataCache.inventory = inventory;

        if (inventory.length === 0) {
            console.log('📦 [FRONTEND] No inventory items found');
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No inventory items found.</td></tr>';
            return;
        }
        
        console.log('📦 [FRONTEND] Rendering inventory items...');

        tbody.innerHTML = inventory.map(item => {
            const isLow = (item.quantity || 0) <= (item.minStock || item.minimumStock || 10);
            return `
                <tr>
                    <td><strong>${item.name || '-'}</strong></td>
                    <td>${item.category || '-'}</td>
                    <td>${item.quantity || 0} ${item.unit || ''}</td>
                    <td>${item.minStock || item.minimumStock || 10}</td>
                    <td><span class="status-badge ${isLow ? 'low-stock' : 'in-stock'}">${isLow ? 'Low Stock' : 'In Stock'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-secondary" onclick="editInventoryItem(${item.id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteInventoryItem(${item.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load inventory:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load inventory</td></tr>';
    }
}

function showInventoryModal(item = null) {
    const form = document.getElementById('inventory-form');
    const title = document.getElementById('inventory-modal-title');
    
    form.reset();
    
    if (item) {
        title.textContent = 'Edit Inventory Item';
        AppState.editingId = item.id;
        document.getElementById('inventory-name').value = item.name || '';
        document.getElementById('inventory-category').value = item.category || 'consumables';
        document.getElementById('inventory-quantity').value = item.quantity || 0;
        document.getElementById('inventory-min-stock').value = item.minStock || item.minimumStock || 10;
        document.getElementById('inventory-unit').value = item.unit || '';
    } else {
        title.textContent = 'Add Inventory Item';
        AppState.editingId = null;
    }
    
    UI.showModal('inventory-modal');
}

async function saveInventoryItem(event) {
    event.preventDefault();
    
    const item = {
        name: document.getElementById('inventory-name').value.trim(),
        category: document.getElementById('inventory-category').value,
        quantity: parseInt(document.getElementById('inventory-quantity').value) || 0,
        minStock: parseInt(document.getElementById('inventory-min-stock').value) || 10,
        minimumStock: parseInt(document.getElementById('inventory-min-stock').value) || 10,
        unit: document.getElementById('inventory-unit').value.trim()
    };

    console.log('💾 [FRONTEND] saveInventoryItem called with:', item);

    try {
        if (AppState.editingId) {
            console.log('   Updating inventory item:', AppState.editingId);
            await Database.updateInventoryItem(AppState.editingId, item);
            UI.toast('Item updated');
        } else {
            console.log('   Creating new inventory item...');
            const result = await Database.createInventoryItem(item);
            console.log('   ✅ Inventory item created, result:', result);
            UI.toast('Item added');
        }
        UI.hideModals();
        console.log('   Reloading inventory...');
        await loadInventory();
        loadStats();
    } catch (error) {
        console.error('❌ [FRONTEND] Failed to save inventory item:', error);
        console.error('   Error message:', error.message);
        UI.toast('Failed to save item: ' + error.message, 'error');
    }
}

async function editInventoryItem(id) {
    const item = DataCache.inventory.find(i => i.id === id);
    if (item) {
        showInventoryModal(item);
    }
}

async function deleteInventoryItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        await Database.deleteInventoryItem(id);
        UI.toast('Item deleted');
        loadInventory();
        loadStats();
    } catch (error) {
        console.error('Failed to delete item:', error);
        UI.toast('Failed to delete item', 'error');
    }
}

// ============================================================================
// SEARCH
// ============================================================================
let searchTimeout = null;

async function handleSearch(event) {
    const query = event.target.value.trim();
    const dropdown = document.getElementById('search-results');

    if (query.length < 2) {
        dropdown.classList.remove('show');
        return;
    }

    // Debounce
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const results = await Database.searchPatients(query);
            
            if (results.length === 0) {
                dropdown.innerHTML = '<div class="search-result-item">No patients found</div>';
            } else {
                dropdown.innerHTML = results.map(p => `
                    <div class="search-result-item" onclick="selectPatient(${p.id}, '${(p.name || '').replace(/'/g, "\\'")}')">
                        <strong>${p.name || 'Unknown'}</strong>
                        <br><small>${UI.formatDate(p.dob || p.dateOfBirth)}</small>
                    </div>
                `).join('');
            }
            dropdown.classList.add('show');
        } catch (error) {
            console.error('Search failed:', error);
        }
    }, 300);
}

function selectPatient(id, name) {
    document.getElementById('search-results').classList.remove('show');
    document.getElementById('search-input').value = '';
    
    // If appointment modal is open, fill in patient
    const appointmentPatientInput = document.getElementById('appointment-patient');
    if (document.getElementById('appointment-modal').classList.contains('show')) {
        appointmentPatientInput.value = name;
        document.getElementById('appointment-patient-id').value = id;
    } else {
        // Navigate to patient view
        switchView('patients');
        UI.toast(`Selected patient: ${name}`);
    }
}

// ============================================================================
// CHAT WITH MCP TOOL EXECUTION
// ============================================================================

// Tool execution map - connects tool names to database actions
const ToolExecutor = {
    async execute(toolName, params) {
        console.log(`🔧 Executing tool: ${toolName}`, params);
        
        // Check database connection first
        if (!Database.isConnected()) {
            console.error('❌ Database not connected! window.db:', window.db);
            return { 
                success: false, 
                message: '❌ Database not connected. Please restart the application.' 
            };
        }
        console.log('✅ Database connected');
        
        switch(toolName.toLowerCase()) {
            // ========== PATIENT OPERATIONS ==========
            case 'create_patient':
                return await this.createPatient(params);
            case 'edit_patient':
            case 'update_patient':
                return await this.updatePatient(params);
            case 'delete_patient':
                return await this.deletePatient(params);
            case 'search_patients':
                return await this.searchPatients(params);
            case 'list_patients':
            case 'get_patients':
                return await this.listPatients();
            case 'get_patient':
                return await this.getPatient(params);
            case 'add_patient_note':
                return await this.addPatientNote(params);
            case 'get_patient_notes':
                return await this.getPatientNotes(params);
            
            // ========== APPOINTMENT OPERATIONS ==========
            case 'create_appointment':
                return await this.createAppointment(params);
            case 'edit_appointment':
            case 'update_appointment':
                return await this.updateAppointment(params);
            case 'delete_appointment':
                return await this.deleteAppointment(params);
            case 'list_appointments':
            case 'get_appointments':
                return await this.listAppointments();
            case 'get_appointment':
                // Treat as create_appointment if it has date/patient info
                if (params.patientName && params.date) {
                    console.log('🔄 Converting get_appointment to create_appointment');
                    return await this.createAppointment(params);
                }
                return await this.listAppointments();
            case 'get_appointments_for_date':
            case 'get_appointments_by_date':
                return await this.getAppointmentsByDate(params);
            
            // ========== DEADLINE OPERATIONS ==========
            case 'create_deadline':
                return await this.createDeadline(params);
            case 'edit_deadline':
            case 'update_deadline':
                return await this.updateDeadline(params);
            case 'delete_deadline':
                return await this.deleteDeadline(params);
            case 'list_upcoming_deadlines':
            case 'list_deadlines':
            case 'get_deadlines':
                return await this.listDeadlines();
            case 'get_deadline':
            case 'get_deadline_details':
                return await this.getDeadlineDetails(params);
            case 'get_deadlines_for_date':
            case 'get_deadlines_by_date':
                return await this.getDeadlinesByDate(params);
            case 'search_deadlines':
                return await this.searchDeadlines(params);
            
            // ========== INVENTORY OPERATIONS ==========
            case 'create_inventory_item':
            case 'add_inventory_item':
                return await this.createInventoryItem(params);
            case 'edit_inventory_item':
            case 'update_inventory_item':
                return await this.updateInventoryItem(params);
            case 'delete_inventory_item':
            case 'remove_inventory_item':
                return await this.deleteInventoryItem(params);
            case 'list_inventory_items':
            case 'get_inventory':
            case 'list_inventory':
                return await this.listInventoryItems(params);
            case 'search_inventory':
                return await this.searchInventory(params);
            case 'get_low_stock':
            case 'list_low_stock':
                return await this.getLowStockItems(params);
            
            // ========== GENERAL ==========
            case 'answer_question':
                return await this.answerQuestion(params);
            
            default:
                // Try to handle unknown tools gracefully
                console.warn(`Unknown tool: ${toolName}`, params);
                // If it looks like an appointment request, try to create it
                if (params.patientName && params.date) {
                    console.log('🔄 Unknown tool with appointment data, creating appointment');
                    return await this.createAppointment(params);
                }
                return { success: true, message: params.response || params.message || "I've processed your request. Is there anything else?" };
        }
    },
    
    async createPatient(params) {
        try {
            const patient = {
                name: params.patientName || params.name || '',
                dob: params.patientDob || params.dob || '',
                phone: params.phone || '',
                email: params.email || ''
            };
            
            if (!patient.name) {
                return { success: false, message: "❌ Patient name is required." };
            }
            
            const result = await Database.createPatient(patient);
            await loadPatients();
            await loadStats();
            
            const patientNumber = result.patientNumber || result.patient_number || result.id;
            
            return { 
                success: true, 
                message: `✅ Patient created successfully!\n\n📋 **Details:**\n• Patient #: ${patientNumber}\n• Name: ${patient.name}${patient.dob ? `\n• DOB: ${UI.formatDate(patient.dob)}` : ''}${patient.phone ? `\n• Phone: ${patient.phone}` : ''}${patient.email ? `\n• Email: ${patient.email}` : ''}`,
                data: result 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to create patient: ${error.message}` };
        }
    },
    
    async createAppointment(params) {
        console.log('📅 createAppointment called with:', params);
        
        try {
            // If patient number is provided, look up the patient
            let patientName = params.patientName || params.patient || '';
            if (params.patientNumber && !patientName) {
                try {
                    const patient = await window.db.getPatient({ patientNumber: params.patientNumber });
                    if (patient && patient.data) {
                        patientName = patient.data.name;
                        console.log(`📅 Found patient #${params.patientNumber}: ${patientName}`);
                    } else {
                        return { success: false, message: `❌ Patient #${params.patientNumber} not found.` };
                    }
                } catch (error) {
                    console.error('❌ Error looking up patient by number:', error);
                    return { success: false, message: `❌ Could not find patient #${params.patientNumber}.` };
                }
            }
            
            // Convert DD/MM/YYYY to YYYY-MM-DD if needed
            let dateStr = params.date || '';
            console.log('📅 Original date:', dateStr);
            
            if (dateStr && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3 && parts[0].length <= 2) {
                    // DD/MM/YYYY format - convert to YYYY-MM-DD
                    dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    console.log('📅 Converted date:', dateStr);
                }
            }
            
            const appointment = {
                patientName: patientName,
                date: dateStr,
                time: params.time || '',
                type: params.type || 'checkup',
                duration: parseInt(params.duration) || 30,
                notes: params.notes || '',
                status: params.status || 'scheduled'
            };
            
            console.log('📅 Appointment object:', appointment);
            
            if (!appointment.patientName) {
                console.log('❌ No patient name');
                return { success: false, message: "❌ Patient name or number is required." };
            }
            
            if (!appointment.date) {
                console.log('❌ No date');
                return { success: false, message: "❌ Appointment date is required." };
            }
            
            // Save to database
            console.log('📅 Calling Database.createAppointment...');
            const result = await Database.createAppointment(appointment);
            console.log('✅ Database.createAppointment returned:', result);
            
            // Refresh dashboard data
            console.log('📅 Refreshing dashboard...');
            await loadStats();
            renderCalendar();
            
            // If viewing the appointment date, refresh the schedule panel
            if (selectedCalendarDate === dateStr) {
                showDateSchedule(dateStr);
            } else {
                loadTodaySchedule();
            }
            
            console.log('✅ Appointment creation complete');
            
            return { 
                success: true, 
                message: `✅ Appointment scheduled successfully!\n\n📋 **Details:**\n• Patient: ${appointment.patientName}\n• Date: ${UI.formatDate(dateStr)}${appointment.time ? `\n• Time: ${appointment.time}` : ''}${appointment.type ? `\n• Type: ${appointment.type}` : ''}${appointment.duration ? `\n• Duration: ${appointment.duration} min` : ''}${appointment.notes ? `\n• Notes: ${appointment.notes}` : ''}\n\n💡 Click on the date in the calendar to view it.`,
                data: result 
            };
        } catch (error) {
            console.error('❌ Failed to create appointment:', error);
            return { success: false, message: `❌ Failed to schedule appointment: ${error.message}` };
        }
    },
    
    async createDeadline(params) {
        try {
            // Convert DD/MM/YYYY to YYYY-MM-DD if needed
            let dateStr = params.date || params.dueDate || '';
            if (dateStr && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3 && parts[0].length <= 2) {
                    // DD/MM/YYYY format - convert to YYYY-MM-DD
                    dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            
            const deadline = {
                title: params.title || params.description || '',
                date: dateStr,
                dueDate: dateStr,
                priority: params.priority || 'medium',
                description: params.description || ''
            };
            
            console.log('⏰ Creating deadline:', deadline);
            
            if (!deadline.title) {
                return { success: false, message: "❌ Deadline title is required." };
            }
            
            // Save to database
            const result = await Database.createDeadline(deadline);
            console.log('✅ Deadline saved to database:', result);
            
            // Refresh dashboard
            await loadStats();
            renderCalendar();
            
            // Refresh schedule panel if viewing that date
            if (selectedCalendarDate === dateStr) {
                showDateSchedule(dateStr);
            } else {
                loadTodaySchedule();
            }
            
            const priorityEmoji = deadline.priority === 'high' ? '🔴' : (deadline.priority === 'low' ? '🟢' : '🟡');
            
            return { 
                success: true, 
                message: `✅ Deadline created successfully!\n\n📋 **Details:**\n• Title: ${deadline.title}\n• Due: ${UI.formatDate(dateStr)}\n• Priority: ${priorityEmoji} ${deadline.priority}${deadline.description ? `\n• Description: ${deadline.description}` : ''}\n\n💡 Click on the date in the calendar to view it.`,
                data: result 
            };
        } catch (error) {
            console.error('❌ Failed to create deadline:', error);
            return { success: false, message: `❌ Failed to create deadline: ${error.message}` };
        }
    },
    
    async addPatientNote(params) {
        try {
            const patients = await Database.searchPatients(params.patientName || '');
            if (!patients || patients.length === 0) {
                return { success: false, message: `❌ Patient "${params.patientName}" not found.` };
            }
            
            const patient = patients[0];
            const result = await window.db.addPatientNote(patient.id, params.note || '', 'admin');
            return { 
                success: true, 
                message: `✅ Note added successfully!\n\n📋 **Details:**\n• Patient: ${patient.name}\n• Note: ${params.note || '(empty)'}`,
                data: result 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to add note: ${error.message}` };
        }
    },
    
    async getPatientNotes(params) {
        try {
            const patients = await Database.searchPatients(params.patientName || '');
            if (!patients || patients.length === 0) {
                return { success: false, message: `❌ Patient "${params.patientName}" not found.` };
            }
            
            const patient = patients[0];
            const result = await window.db.getPatientNotes(patient.id);
            const notes = result?.data || [];
            
            if (notes.length === 0) {
                return { success: true, message: `📋 **${patient.name}** - No notes found.` };
            }
            
            const notesList = notes.map(n => `• ${n.note || n.text}`).join('\n');
            return { 
                success: true, 
                message: `📋 **Notes for ${patient.name}:**\n${notesList}`,
                data: notes 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to get notes: ${error.message}` };
        }
    },
    
    async listPatients() {
        try {
            const patients = await Database.getPatients();
            if (patients.length === 0) {
                return { success: true, message: "📋 **Patients:** None found." };
            }
            
            const list = patients.slice(0, 10).map(p => {
                const num = p.patientNumber || p.patient_number || p.id;
                return `• #${num} - ${p.name}`;
            }).join('\n');
            const more = patients.length > 10 ? `\n... +${patients.length - 10} more` : '';
            return { 
                success: true, 
                message: `📋 **Patients (${patients.length}):**\n${list}${more}`,
                data: patients 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to list patients: ${error.message}` };
        }
    },
    
    async listAppointments() {
        try {
            const appointments = await Database.getAppointments();
            if (appointments.length === 0) {
                return { success: true, message: "📅 **Appointments:** None scheduled." };
            }
            
            const sorted = [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date));
            const upcoming = sorted.filter(a => new Date(a.date) >= new Date().setHours(0,0,0,0));
            
            if (upcoming.length === 0) {
                return { success: true, message: "📅 **Appointments:** No upcoming appointments." };
            }
            
            const list = upcoming.slice(0, 8).map(a => 
                `• ${UI.formatDate(a.date)} ${a.time || ''} - ${a.patientName || 'Unknown'}`
            ).join('\n');
            const more = upcoming.length > 8 ? `\n... +${upcoming.length - 8} more` : '';
            
            return { 
                success: true, 
                message: `📅 **Upcoming Appointments (${upcoming.length}):**\n${list}${more}`,
                data: appointments 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to list appointments: ${error.message}` };
        }
    },
    
    async listDeadlines() {
        try {
            const deadlines = await Database.getDeadlines();
            if (deadlines.length === 0) {
                return { success: true, message: "⏰ **Deadlines:** None set." };
            }
            
            const sorted = [...deadlines].sort((a, b) => new Date(a.date || a.dueDate) - new Date(b.date || b.dueDate));
            const upcoming = sorted.filter(d => new Date(d.date || d.dueDate) >= new Date().setHours(0,0,0,0));
            
            if (upcoming.length === 0) {
                return { success: true, message: "⏰ **Deadlines:** No upcoming deadlines." };
            }
            
            const list = upcoming.slice(0, 8).map(d => {
                const emoji = d.priority === 'high' ? '🔴' : (d.priority === 'low' ? '🟢' : '🟡');
                return `${emoji} ${UI.formatDate(d.date || d.dueDate)} - ${d.title}`;
            }).join('\n');
            
            return { 
                success: true, 
                message: `⏰ **Upcoming Deadlines (${upcoming.length}):**\n${list}`,
                data: deadlines 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to list deadlines: ${error.message}` };
        }
    },
    
    async searchPatients(params) {
        try {
            const query = params.query || params.patientName || '';
            const patients = await Database.searchPatients(query);
            
            if (patients.length === 0) {
                return { success: true, message: `🔍 **Search "${query}":** No patients found.` };
            }
            
            if (patients.length === 1) {
                const p = patients[0];
                return { 
                    success: true, 
                    message: `🔍 **Found Patient:**\n• Name: ${p.name}${p.dob ? `\n• DOB: ${UI.formatDate(p.dob)}` : ''}${p.phone ? `\n• Phone: ${p.phone}` : ''}${p.email ? `\n• Email: ${p.email}` : ''}`,
                    data: patients 
                };
            }
            
            const list = patients.map(p => `• ${p.name}${p.dob ? ` (${UI.formatDate(p.dob)})` : ''}`).join('\n');
            return { 
                success: true, 
                message: `🔍 **Found ${patients.length} patients for "${query}":**\n${list}`,
                data: patients 
            };
        } catch (error) {
            return { success: false, message: `❌ Search failed: ${error.message}` };
        }
    },
    
    async deleteAppointment(params) {
        try {
            const appointments = await Database.getAppointments();
            const match = appointments.find(a => 
                (a.patientName || '').toLowerCase().includes((params.patientName || '').toLowerCase()) &&
                (a.date === params.date || !params.date)
            );
            
            if (!match) {
                return { success: false, message: `❌ Appointment not found for "${params.patientName || 'unknown'}".` };
            }
            
            await Database.deleteAppointment(match.id);
            await loadDashboard();
            return { 
                success: true, 
                message: `✅ Appointment deleted successfully!\n\n📋 **Deleted:**\n• Patient: ${match.patientName}\n• Date: ${UI.formatDate(match.date)}${match.time ? `\n• Time: ${match.time}` : ''}`
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to delete appointment: ${error.message}` };
        }
    },
    
    async deleteDeadline(params) {
        try {
            const deadlines = await Database.getDeadlines();
            const match = deadlines.find(d => 
                (d.title || '').toLowerCase().includes((params.title || '').toLowerCase())
            );
            
            if (!match) {
                return { success: false, message: `❌ Deadline "${params.title || 'unknown'}" not found.` };
            }
            
            await Database.deleteDeadline(match.id);
            await loadDashboard();
            return { 
                success: true, 
                message: `✅ Deadline deleted successfully!\n\n📋 **Deleted:**\n• Title: ${match.title}\n• Due: ${UI.formatDate(match.date || match.dueDate)}`
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to delete deadline: ${error.message}` };
        }
    },
    
    // ========== ADDITIONAL PATIENT OPERATIONS ==========
    async updatePatient(params) {
        try {
            const patients = await Database.searchPatients(params.patientName || params.name || '');
            if (patients.length === 0) {
                return { success: false, message: `❌ Patient "${params.patientName || params.name}" not found.` };
            }
            
            const patient = patients[0];
            const updates = {};
            if (params.newName) updates.name = params.newName;
            if (params.newDob) updates.dob = params.newDob;
            if (params.newPhone) updates.phone = params.newPhone;
            if (params.newEmail) updates.email = params.newEmail;
            
            await Database.updatePatient(patient.id, updates);
            await loadPatients();
            return { 
                success: true, 
                message: `✅ Patient updated successfully!\n\n📋 **Updated:**\n• Name: ${updates.name || patient.name}${updates.dob ? `\n• DOB: ${UI.formatDate(updates.dob)}` : ''}${updates.phone ? `\n• Phone: ${updates.phone}` : ''}`,
                data: { id: patient.id, ...updates }
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to update patient: ${error.message}` };
        }
    },
    
    async deletePatient(params) {
        try {
            const patients = await Database.searchPatients(params.patientName || params.name || '');
            if (patients.length === 0) {
                return { success: false, message: `❌ Patient "${params.patientName || params.name}" not found.` };
            }
            
            const patient = patients[0];
            await Database.deletePatient(patient.id);
            await loadPatients();
            await loadStats();
            return { 
                success: true, 
                message: `✅ Patient deleted successfully!\n\n📋 **Deleted:**\n• Name: ${patient.name}${patient.dob ? `\n• DOB: ${UI.formatDate(patient.dob)}` : ''}`
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to delete patient: ${error.message}` };
        }
    },
    
    async getPatient(params) {
        try {
            let patient = null;
            if (params.patientNumber) {
                const result = await window.db.getPatient({ patientNumber: params.patientNumber });
                patient = result?.data;
            } else if (params.patientName) {
                const patients = await Database.searchPatients(params.patientName);
                patient = patients[0];
            }
            
            if (!patient) {
                return { success: false, message: `❌ Patient not found.` };
            }
            
            return { 
                success: true, 
                message: `📋 **Patient Details:**\n• Name: ${patient.name}${patient.dob ? `\n• DOB: ${UI.formatDate(patient.dob)}` : ''}${patient.phone ? `\n• Phone: ${patient.phone}` : ''}${patient.email ? `\n• Email: ${patient.email}` : ''}${patient.patientNumber ? `\n• Patient #: ${patient.patientNumber}` : ''}`,
                data: patient 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to get patient: ${error.message}` };
        }
    },
    
    // ========== ADDITIONAL APPOINTMENT OPERATIONS ==========
    async updateAppointment(params) {
        try {
            const appointments = await Database.getAppointments();
            const match = appointments.find(a => 
                (a.patientName || '').toLowerCase().includes((params.patientName || '').toLowerCase()) &&
                (a.date === params.date || !params.date)
            );
            
            if (!match) {
                return { success: false, message: `❌ Appointment not found.` };
            }
            
            const updates = {};
            if (params.newDate) updates.date = params.newDate;
            if (params.newTime) updates.time = params.newTime;
            if (params.newType) updates.type = params.newType;
            if (params.newStatus) updates.status = params.newStatus;
            if (params.newNotes) updates.notes = params.newNotes;
            
            await Database.updateAppointment(match.id, updates);
            await loadDashboard();
            return { 
                success: true, 
                message: `✅ Appointment updated successfully!\n\n📋 **Updated:**\n• Patient: ${match.patientName}\n• Date: ${updates.date ? UI.formatDate(updates.date) : UI.formatDate(match.date)}${updates.time ? `\n• Time: ${updates.time}` : match.time ? `\n• Time: ${match.time}` : ''}`,
                data: { id: match.id, ...updates }
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to update appointment: ${error.message}` };
        }
    },
    
    async getAppointmentsByDate(params) {
        try {
            let dateStr = params.date || '';
            if (dateStr && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3 && parts[0].length <= 2) {
                    dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            
            const result = await window.db.getAppointmentsByDate(dateStr);
            const appointments = result?.data || [];
            
            if (appointments.length === 0) {
                return { success: true, message: `📅 **Appointments for ${UI.formatDate(dateStr)}:** None scheduled.` };
            }
            
            const list = appointments.map(a => 
                `• ${a.time || 'All day'} - ${a.patientName || 'Unknown'}${a.type ? ` (${a.type})` : ''}`
            ).join('\n');
            
            return { 
                success: true, 
                message: `📅 **Appointments for ${UI.formatDate(dateStr)} (${appointments.length}):**\n${list}`,
                data: appointments 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to get appointments: ${error.message}` };
        }
    },
    
    // ========== ADDITIONAL DEADLINE OPERATIONS ==========
    async updateDeadline(params) {
        try {
            const deadlines = await Database.getDeadlines();
            const match = deadlines.find(d => 
                (d.title || '').toLowerCase().includes((params.title || params.oldTitle || '').toLowerCase())
            );
            
            if (!match) {
                return { success: false, message: `❌ Deadline "${params.title || params.oldTitle}" not found.` };
            }
            
            const updates = {};
            if (params.newTitle) updates.title = params.newTitle;
            if (params.newDate) updates.date = params.newDate;
            if (params.newPriority) updates.priority = params.newPriority;
            if (params.newDescription) updates.description = params.newDescription;
            
            await Database.updateDeadline(match.id, updates);
            await loadDashboard();
            return { 
                success: true, 
                message: `✅ Deadline updated successfully!\n\n📋 **Updated:**\n• Title: ${updates.title || match.title}\n• Due: ${updates.date ? UI.formatDate(updates.date) : UI.formatDate(match.date || match.dueDate)}`,
                data: { id: match.id, ...updates }
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to update deadline: ${error.message}` };
        }
    },
    
    async getDeadlineDetails(params) {
        try {
            const deadlines = await Database.getDeadlines();
            const match = deadlines.find(d => 
                (d.title || '').toLowerCase().includes((params.title || '').toLowerCase())
            );
            
            if (!match) {
                return { success: false, message: `❌ Deadline "${params.title}" not found.` };
            }
            
            const priorityEmoji = match.priority === 'high' ? '🔴' : (match.priority === 'low' ? '🟢' : '🟡');
            return { 
                success: true, 
                message: `⏰ **Deadline Details:**\n• Title: ${match.title}\n• Due: ${UI.formatDate(match.date || match.dueDate)}\n• Priority: ${priorityEmoji} ${match.priority || 'medium'}${match.description ? `\n• Description: ${match.description}` : ''}`,
                data: match 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to get deadline: ${error.message}` };
        }
    },
    
    async getDeadlinesByDate(params) {
        try {
            let dateStr = params.date || '';
            if (dateStr && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3 && parts[0].length <= 2) {
                    dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            
            const deadlines = await Database.getDeadlines();
            const filtered = deadlines.filter(d => (d.date || d.dueDate) === dateStr);
            
            if (filtered.length === 0) {
                return { success: true, message: `⏰ **Deadlines for ${UI.formatDate(dateStr)}:** None set.` };
            }
            
            const list = filtered.map(d => {
                const emoji = d.priority === 'high' ? '🔴' : (d.priority === 'low' ? '🟢' : '🟡');
                return `${emoji} ${d.title}${d.description ? ` - ${d.description}` : ''}`;
            }).join('\n');
            
            return { 
                success: true, 
                message: `⏰ **Deadlines for ${UI.formatDate(dateStr)} (${filtered.length}):**\n${list}`,
                data: filtered 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to get deadlines: ${error.message}` };
        }
    },
    
    async searchDeadlines(params) {
        try {
            const query = params.query || params.title || '';
            const deadlines = await Database.getDeadlines();
            const filtered = deadlines.filter(d => 
                (d.title || '').toLowerCase().includes(query.toLowerCase()) ||
                (d.description || '').toLowerCase().includes(query.toLowerCase())
            );
            
            if (filtered.length === 0) {
                return { success: true, message: `🔍 **Search "${query}":** No deadlines found.` };
            }
            
            const list = filtered.map(d => {
                const emoji = d.priority === 'high' ? '🔴' : (d.priority === 'low' ? '🟢' : '🟡');
                return `${emoji} ${UI.formatDate(d.date || d.dueDate)} - ${d.title}`;
            }).join('\n');
            
            return { 
                success: true, 
                message: `🔍 **Found ${filtered.length} deadlines for "${query}":**\n${list}`,
                data: filtered 
            };
        } catch (error) {
            return { success: false, message: `❌ Search failed: ${error.message}` };
        }
    },
    
    // ========== INVENTORY OPERATIONS ==========
    async createInventoryItem(params) {
        try {
            const item = {
                name: params.name || params.itemName || '',
                category: params.category || 'consumables',
                quantity: parseInt(params.quantity) || 0,
                minStock: parseInt(params.minStock || params.minimumStock) || 10,
                unit: params.unit || ''
            };
            
            if (!item.name) {
                return { success: false, message: "❌ Item name is required." };
            }
            
            const result = await Database.createInventoryItem(item);
            await loadInventory();
            await loadStats();
            
            return { 
                success: true, 
                message: `✅ Inventory item created successfully!\n\n📋 **Details:**\n• Name: ${item.name}\n• Category: ${item.category}\n• Quantity: ${item.quantity} ${item.unit || ''}\n• Min Stock: ${item.minStock}`,
                data: result 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to create inventory item: ${error.message}` };
        }
    },
    
    async updateInventoryItem(params) {
        try {
            const inventory = await Database.getInventory();
            const match = inventory.find(i => 
                (i.name || '').toLowerCase().includes((params.name || params.itemName || '').toLowerCase())
            );
            
            if (!match) {
                return { success: false, message: `❌ Inventory item "${params.name || params.itemName}" not found.` };
            }
            
            const updates = {};
            if (params.newName) updates.name = params.newName;
            if (params.newQuantity !== undefined) updates.quantity = parseInt(params.newQuantity);
            if (params.newMinStock !== undefined) updates.minStock = parseInt(params.newMinStock);
            if (params.newCategory) updates.category = params.newCategory;
            if (params.newUnit) updates.unit = params.newUnit;
            
            await Database.updateInventoryItem(match.id, updates);
            await loadInventory();
            return { 
                success: true, 
                message: `✅ Inventory item updated successfully!\n\n📋 **Updated:**\n• Name: ${updates.name || match.name}\n• Quantity: ${updates.quantity !== undefined ? updates.quantity : match.quantity} ${updates.unit || match.unit || ''}`,
                data: { id: match.id, ...updates }
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to update inventory item: ${error.message}` };
        }
    },
    
    async deleteInventoryItem(params) {
        try {
            const inventory = await Database.getInventory();
            const match = inventory.find(i => 
                (i.name || '').toLowerCase().includes((params.name || params.itemName || '').toLowerCase())
            );
            
            if (!match) {
                return { success: false, message: `❌ Inventory item "${params.name || params.itemName}" not found.` };
            }
            
            await Database.deleteInventoryItem(match.id);
            await loadInventory();
            await loadStats();
            return { 
                success: true, 
                message: `✅ Inventory item deleted successfully!\n\n📋 **Deleted:**\n• Name: ${match.name}\n• Category: ${match.category || 'N/A'}`,
                data: { id: match.id }
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to delete inventory item: ${error.message}` };
        }
    },
    
    async listInventoryItems(params) {
        try {
            const inventory = await Database.getInventory();
            if (inventory.length === 0) {
                return { success: true, message: "📦 **Inventory:** No items found." };
            }
            
            const filtered = params.lowStock ? inventory.filter(i => (i.quantity || 0) <= (i.minStock || 10)) : inventory;
            
            if (filtered.length === 0) {
                return { success: true, message: "📦 **Low Stock Items:** None found." };
            }
            
            const list = filtered.slice(0, 10).map(i => {
                const isLow = (i.quantity || 0) <= (i.minStock || 10);
                const status = isLow ? '🔴' : '🟢';
                return `${status} ${i.name} - ${i.quantity || 0} ${i.unit || ''} (min: ${i.minStock || 10})`;
            }).join('\n');
            const more = filtered.length > 10 ? `\n... +${filtered.length - 10} more` : '';
            
            return { 
                success: true, 
                message: `📦 **Inventory (${filtered.length}):**\n${list}${more}`,
                data: filtered 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to list inventory: ${error.message}` };
        }
    },
    
    async searchInventory(params) {
        try {
            const query = params.query || params.name || '';
            const inventory = await Database.getInventory();
            const filtered = inventory.filter(i => 
                (i.name || '').toLowerCase().includes(query.toLowerCase()) ||
                (i.category || '').toLowerCase().includes(query.toLowerCase())
            );
            
            if (filtered.length === 0) {
                return { success: true, message: `🔍 **Search "${query}":** No inventory items found.` };
            }
            
            const list = filtered.map(i => {
                const isLow = (i.quantity || 0) <= (i.minStock || 10);
                const status = isLow ? '🔴' : '🟢';
                return `${status} ${i.name} - ${i.quantity || 0} ${i.unit || ''}`;
            }).join('\n');
            
            return { 
                success: true, 
                message: `🔍 **Found ${filtered.length} items for "${query}":**\n${list}`,
                data: filtered 
            };
        } catch (error) {
            return { success: false, message: `❌ Search failed: ${error.message}` };
        }
    },
    
    async getLowStockItems(params) {
        try {
            const result = await window.db.getLowStock();
            const items = result?.data || [];
            
            if (items.length === 0) {
                return { success: true, message: "📦 **Low Stock Items:** None found. All items are well stocked." };
            }
            
            const list = items.map(i => {
                const name = i.name || i.item_name;
                const quantity = i.quantity || 0;
                const minStock = i.minStock || i.min_quantity || 10;
                const unit = i.unit || '';
                return `🔴 ${name} - ${quantity} ${unit} (min: ${minStock})`;
            }).join('\n');
            
            return { 
                success: true, 
                message: `📦 **Low Stock Items (${items.length}):**\n${list}`,
                data: items 
            };
        } catch (error) {
            return { success: false, message: `❌ Failed to get low stock items: ${error.message}` };
        }
    },
    
    async answerQuestion(params) {
        const response = params.response || params.answer || params.message || 
                        "How can I help you? I can create appointments, manage patients, set deadlines, and more.";
        return { success: true, message: response };
    }
};

// ============================================================================
// RAG AGENT
// ============================================================================
async function callRAGAgent(question) {
    console.log('🔍 RAG Agent called:', question);
    
    // Check if RAG API is available
    if (!window.api || !window.api.ragQuery) {
        return {
            success: false,
            error: "RAG API not available. Please make sure the backend is running.",
            answer: null,
            sources: []
        };
    }
    
    try {
        // Start RAG server if not already started
        if (window.api.startRagServer) {
            const startResult = await window.api.startRagServer();
            if (!startResult.success) {
                console.warn('⚠️ RAG server start result:', startResult);
            }
        }
        
        // Call RAG query API
        const result = await window.api.ragQuery(question);
        console.log('📨 RAG Response:', result);
        
        return result;
    } catch (error) {
        console.error('❌ RAG Agent error:', error);
        return {
            success: false,
            error: error.message || 'Failed to query RAG agent',
            answer: null,
            sources: []
        };
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('chat-messages');
    
    // Add user message
    chatMessages.innerHTML += `
        <div class="chat-message user">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Check current AI mode
    const currentMode = AppState.aiMode || 'mcp';
    console.log(`🤖 Using AI mode: ${currentMode}`);
    
    // Show thinking indicator
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'chat-message assistant thinking';
    thinkingDiv.innerHTML = `<p><span class="thinking-dots">●●●</span> Processing with ${currentMode === 'mcp' ? 'MCP Chatbot' : 'RAG Agent'}...</p>`;
    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        let response;
        
        // Route to appropriate backend based on mode
        if (currentMode === 'rag') {
            // RAG Agent mode - call RAG agent
            response = await callRAGAgent(message);
        } else {
            // MCP Chatbot mode (default)
            if (!window.api || !window.api.chatWithLLM) {
                addAssistantMessage(chatMessages, "I'm having trouble connecting to the AI service. Please make sure the backend is running and try again.");
                thinkingDiv.remove();
                return;
            }
            
            // Call the MCP LLM
            response = await window.api.chatWithLLM(message, [], {
                patients: DataCache.patients,
                appointments: DataCache.appointments,
                deadlines: DataCache.deadlines
            });
        }
        
        // Remove thinking indicator
        thinkingDiv.remove();
        
        // Handle RAG agent responses
        if (currentMode === 'rag') {
            if (!response || !response.success) {
                const errorMsg = response?.error || 'Failed to get response from RAG agent';
                addAssistantMessage(chatMessages, `❌ **Error:** ${errorMsg}\n\nPlease make sure the RAG server is running and models are loaded.`);
                return;
            }
            
            // Format RAG response with answer and clickable sources
            const answer = response.answer || 'No answer provided.';
            
            // Create message container
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message assistant';
            
            // Add answer
            const answerP = document.createElement('p');
            answerP.style.whiteSpace = 'pre-wrap'; // Preserve line breaks
            let formattedAnswer = formatMarkdown(answer);
            formattedAnswer = linkifyEntityMentions(formattedAnswer);
            answerP.innerHTML = formattedAnswer;
            messageDiv.appendChild(answerP);
            
            // Add click handlers for entity links in RAG responses
            const entityLinks = answerP.querySelectorAll('.entity-link');
            entityLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleEntityLinkClick(link);
                });
            });
            
            // Add sources as clickable links if available
            if (response.sources && response.sources.length > 0) {
                const sourcesDiv = document.createElement('div');
                sourcesDiv.className = 'rag-sources';
                sourcesDiv.style.marginTop = '12px';
                sourcesDiv.style.paddingTop = '12px';
                sourcesDiv.style.borderTop = '1px solid var(--border-color)';
                
                const sourcesTitle = document.createElement('strong');
                sourcesTitle.textContent = 'Sources:';
                sourcesTitle.style.display = 'block';
                sourcesTitle.style.marginBottom = '8px';
                sourcesTitle.style.color = 'var(--accent-primary)';
                sourcesDiv.appendChild(sourcesTitle);
                
                const sourcesList = document.createElement('div');
                sourcesList.style.display = 'flex';
                sourcesList.style.flexDirection = 'column';
                sourcesList.style.gap = '6px';
                
                response.sources.forEach((source, index) => {
                    const sourceItem = document.createElement('div');
                    sourceItem.style.display = 'flex';
                    sourceItem.style.alignItems = 'center';
                    sourceItem.style.gap = '8px';
                    
                    const sourceNumber = document.createElement('span');
                    sourceNumber.textContent = `${index + 1}.`;
                    sourceNumber.style.color = 'var(--text-secondary)';
                    sourceNumber.style.minWidth = '24px';
                    sourceItem.appendChild(sourceNumber);
                    
                    // Handle both string (legacy) and object (new) formats
                    const sourceTitle = typeof source === 'string' ? source : (source.title || 'Untitled');
                    const sourceUrl = typeof source === 'object' ? (source.url || '') : '';
                    
                    if (sourceUrl) {
                        // Clickable link
                        const sourceLink = document.createElement('a');
                        sourceLink.textContent = sourceTitle;
                        sourceLink.href = sourceUrl;
                        sourceLink.target = '_blank';
                        sourceLink.rel = 'noopener noreferrer';
                        sourceLink.style.color = 'var(--accent-primary)';
                        sourceLink.style.textDecoration = 'none';
                        sourceLink.style.cursor = 'pointer';
                        sourceLink.style.transition = 'color 0.2s';
                        sourceLink.addEventListener('mouseenter', () => {
                            sourceLink.style.color = 'var(--accent-primary-light)';
                            sourceLink.style.textDecoration = 'underline';
                        });
                        sourceLink.addEventListener('mouseleave', () => {
                            sourceLink.style.color = 'var(--accent-primary)';
                            sourceLink.style.textDecoration = 'none';
                        });
                        sourceItem.appendChild(sourceLink);
                        
                        // Add external link icon
                        const linkIcon = document.createElement('span');
                        linkIcon.textContent = '🔗';
                        linkIcon.style.fontSize = '12px';
                        linkIcon.style.marginLeft = '4px';
                        sourceItem.appendChild(linkIcon);
                    } else {
                        // Plain text (no URL available)
                        const sourceText = document.createElement('span');
                        sourceText.textContent = sourceTitle;
                        sourceText.style.color = 'var(--text-primary)';
                        sourceItem.appendChild(sourceText);
                    }
                    
                    sourcesList.appendChild(sourceItem);
                });
                
                sourcesDiv.appendChild(sourcesList);
                messageDiv.appendChild(sourcesDiv);
            }
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return;
        }
        
        // Parse MCP chatbot response
        let parsed;
        try {
            parsed = typeof response === 'string' ? JSON.parse(response) : response;
        } catch {
            // Not JSON, treat as plain text response
            addAssistantMessage(chatMessages, formatFriendlyResponse(response));
            return;
        }
        
        console.log('📨 LLM Response:', parsed);
        
        // Handle nested JSON string in response field
        if (parsed.response && typeof parsed.response === 'string') {
            try {
                const nestedParsed = JSON.parse(parsed.response);
                console.log('📨 Parsed nested response:', nestedParsed);
                // Merge nested response into main parsed object
                parsed = { ...parsed, ...nestedParsed };
            } catch (e) {
                console.warn('⚠️ Could not parse nested response:', e);
            }
        }
        
        console.log('📨 Response type check - tool:', parsed.tool, 'needsExecution:', parsed.needsExecution, 'success:', parsed.success);
        
        // Check if this is a tool call that needs execution (MCP mode only)
        if (parsed.tool && parsed.tool !== 'answer_question') {
            const toolName = parsed.tool;
            const params = parsed.parameters || {};
            
            console.log(`🔧 Executing tool: ${toolName}`);
            console.log('🔧 Parameters:', JSON.stringify(params, null, 2));
            
            try {
                // Execute the tool
                const result = await ToolExecutor.execute(toolName, params);
                console.log('🔧 Tool result:', result);
                
                // Show result message
                if (result && result.message) {
                    addAssistantMessage(chatMessages, result.message);
                } else if (result && result.success) {
                    addAssistantMessage(chatMessages, '✅ Action completed successfully.');
                } else {
                    addAssistantMessage(chatMessages, result?.error || '❌ Action failed.');
                }
                
                console.log('✅ Tool execution complete');
            } catch (toolError) {
                console.error('❌ Tool execution exception:', toolError);
                addAssistantMessage(chatMessages, `❌ Failed to execute action: ${toolError.message}`);
            }
        } else if (parsed.response || parsed.message || parsed.parameters?.response) {
            // Regular response or answer_question
            let responseText = parsed.response || parsed.message || parsed.parameters?.response;
            
            // If response is a JSON string, try to parse it
            if (typeof responseText === 'string' && responseText.trim().startsWith('{')) {
                try {
                    const jsonParsed = JSON.parse(responseText);
                    // If it's a tool call, execute it
                    if (jsonParsed.tool && jsonParsed.tool !== 'answer_question') {
                        console.log('🔧 Found tool in response string, executing:', jsonParsed.tool);
                        const result = await ToolExecutor.execute(jsonParsed.tool, jsonParsed.parameters || {});
                        if (result && result.message) {
                            addAssistantMessage(chatMessages, result.message);
                        } else {
                            addAssistantMessage(chatMessages, '✅ Action completed successfully.');
                        }
                        return;
                    }
                } catch (e) {
                    // Not JSON, treat as plain text
                }
            }
            
            console.log('💬 Showing response text:', responseText);
            addAssistantMessage(chatMessages, responseText);
        } else if (parsed.success === false && parsed.error) {
            // Error response
            console.log('❌ Error response:', parsed.error);
            addAssistantMessage(chatMessages, `❌ ${parsed.error}`);
        } else {
            // Unknown format - don't show raw JSON
            console.warn('⚠️ Unknown response format, showing generic message');
            addAssistantMessage(chatMessages, 'I processed your request. Is there anything else I can help with?');
        }
        
    } catch (error) {
        console.error('Chat error:', error);
        thinkingDiv.remove();
        addAssistantMessage(chatMessages, getFriendlyError(error.message));
    }
}

// Format responses to be user-friendly
function formatFriendlyResponse(response) {
    if (typeof response === 'string') {
        let text = response.trim();
        return text || "Request processed.";
    }
    
    if (response.message) return response.message;
    if (response.response) return response.response;
    
    return "Request processed.";
}

// Get user-friendly error messages
function getFriendlyError(errorMessage) {
    return `❌ Error: ${errorMessage}`;
}

// Linkify mentions of patients, appointments, deadlines, and inventory items
function linkifyEntityMentions(text) {
    if (!text) return text;
    
    // Don't linkify if text already contains entity links (to avoid double-linking)
    if (text.includes('entity-link')) {
        return text;
    }
    
    let linkedText = text;
    
    // Use a placeholder system to avoid matching inside existing HTML tags
    const placeholders = new Map();
    let placeholderIndex = 0;
    
    // Replace existing HTML tags with placeholders
    linkedText = linkedText.replace(/<[^>]+>/g, (match) => {
        const placeholder = `__PLACEHOLDER_${placeholderIndex}__`;
        placeholders.set(placeholder, match);
        placeholderIndex++;
        return placeholder;
    });
    
    // Link patient mentions (by name or patient number)
    DataCache.patients.forEach(patient => {
        const name = patient.name || '';
        const patientNumber = patient.patient_number;
        
        if (name && name.length > 2) {
            // Match patient name (case-insensitive, whole word)
            const nameRegex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi');
            linkedText = linkedText.replace(nameRegex, (match) => {
                return `<a href="#" class="entity-link patient-link" data-type="patient" data-id="${patient.id}" data-name="${escapeHtml(name)}">${match}</a>`;
            });
        }
        
        if (patientNumber) {
            // Match patient number (#123 or patient #123)
            const numberRegex = new RegExp(`(?:patient\\s*)?#${patientNumber}\\b`, 'gi');
            linkedText = linkedText.replace(numberRegex, (match) => {
                return `<a href="#" class="entity-link patient-link" data-type="patient" data-id="${patient.id}" data-name="${escapeHtml(name || `Patient #${patientNumber}`)}">${match}</a>`;
            });
        }
    });
    
    // Link appointment mentions (by date)
    DataCache.appointments.forEach(appointment => {
        const date = appointment.date;
        
        if (date) {
            // Format date for matching
            const formattedDate = UI.formatDate(date);
            if (formattedDate && formattedDate !== 'Invalid Date') {
                const dateRegex = new RegExp(`\\b${escapeRegex(formattedDate)}\\b`, 'gi');
                linkedText = linkedText.replace(dateRegex, (match) => {
                    return `<a href="#" class="entity-link appointment-link" data-type="appointment" data-id="${appointment.id}" data-date="${date}">${match}</a>`;
                });
            }
        }
    });
    
    // Link deadline mentions (by title)
    DataCache.deadlines.forEach(deadline => {
        const title = deadline.title || '';
        if (title && title.length > 3) {
            // Match deadline titles (case-insensitive, whole phrase)
            const titleRegex = new RegExp(`\\b${escapeRegex(title)}\\b`, 'gi');
            linkedText = linkedText.replace(titleRegex, (match) => {
                return `<a href="#" class="entity-link deadline-link" data-type="deadline" data-id="${deadline.id}" data-title="${escapeHtml(title)}">${match}</a>`;
            });
        }
    });
    
    // Link inventory item mentions (by name)
    DataCache.inventory.forEach(item => {
        const itemName = item.name || item.itemName || '';
        if (itemName && itemName.length > 2) {
            // Match inventory item names (case-insensitive, whole word)
            const nameRegex = new RegExp(`\\b${escapeRegex(itemName)}\\b`, 'gi');
            linkedText = linkedText.replace(nameRegex, (match) => {
                return `<a href="#" class="entity-link inventory-link" data-type="inventory" data-id="${item.id}" data-name="${escapeHtml(itemName)}">${match}</a>`;
            });
        }
    });
    
    // Restore placeholders
    placeholders.forEach((original, placeholder) => {
        linkedText = linkedText.replace(placeholder, original);
    });
    
    return linkedText;
}

// Escape special regex characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Format markdown text to HTML
function formatMarkdown(text) {
    if (!text) return '';
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // **bold**
        .replace(/\*(.+?)\*/g, '<em>$1</em>')               // *italic*
        .replace(/`(.+?)`/g, '<code>$1</code>')             // `code`
        .replace(/\n\n+/g, '<br><br>')                      // Multiple newlines
        .replace(/\n/g, '<br>');                            // Single newlines
}

function addAssistantMessage(container, message) {
    const div = document.createElement('div');
    div.className = 'chat-message assistant';
    
    // Format message with basic markdown support
    let formatted = formatMarkdown(message);
    
    // Linkify entity mentions (patients, appointments, deadlines, inventory)
    formatted = linkifyEntityMentions(formatted);
    
    div.innerHTML = `<p>${formatted}</p>`;
    
    // Add click handlers for entity links
    const entityLinks = div.querySelectorAll('.entity-link');
    entityLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleEntityLinkClick(link);
        });
    });
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Handle clicks on entity links (patients, appointments, deadlines, inventory)
function handleEntityLinkClick(linkElement) {
    const type = linkElement.dataset.type;
    const id = parseInt(linkElement.dataset.id);
    
    if (!id || !type) {
        console.warn('Invalid entity link:', linkElement.dataset);
        return;
    }
    
    switch(type) {
        case 'patient':
            // Switch to patients view and open patient modal
            switchView('patients');
            setTimeout(() => {
                editPatient(id);
            }, 100);
            UI.toast(`Opening patient: ${linkElement.dataset.name || 'Patient'}`);
            break;
            
        case 'appointment':
            // Switch to appointments view and open appointment modal
            switchView('appointments');
            setTimeout(() => {
                editAppointment(id);
            }, 100);
            UI.toast(`Opening appointment from ${linkElement.dataset.date || 'date'}`);
            break;
            
        case 'deadline':
            // Switch to deadlines view and open deadline modal
            switchView('deadlines');
            setTimeout(() => {
                editDeadline(id);
            }, 100);
            UI.toast(`Opening deadline: ${linkElement.dataset.title || 'Deadline'}`);
            break;
            
        case 'inventory':
            // Switch to inventory view and open inventory modal
            switchView('inventory');
            setTimeout(() => {
                editInventoryItem(id);
            }, 100);
            UI.toast(`Opening inventory item: ${linkElement.dataset.name || 'Item'}`);
            break;
            
        default:
            console.warn('Unknown entity type:', type);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// VOICE RECORDING WITH MICROPHONE SELECTION
// ============================================================================
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let audioContext = null;
let analyser = null;
let selectedMicrophoneId = null;
let levelAnimationFrame = null;

// Initialize microphone list
async function initializeMicrophones() {
    try {
        // Request permission first (required to get device labels)
        await navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => stream.getTracks().forEach(track => track.stop()));
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        const micSelect = document.getElementById('mic-select');
        if (!micSelect) return;
        
        micSelect.innerHTML = '';
        
        if (audioInputs.length === 0) {
            micSelect.innerHTML = '<option value="">No microphones found</option>';
            return;
        }
        
        audioInputs.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${index + 1}`;
            micSelect.appendChild(option);
        });
        
        // Select first microphone by default
        selectedMicrophoneId = audioInputs[0].deviceId;
        
        // Handle microphone change
        micSelect.addEventListener('change', (e) => {
            selectedMicrophoneId = e.target.value;
            console.log('Selected microphone:', selectedMicrophoneId);
        });
        
        console.log(`Found ${audioInputs.length} microphones`);
    } catch (error) {
        console.error('Failed to enumerate microphones:', error);
        const micSelect = document.getElementById('mic-select');
        if (micSelect) {
            micSelect.innerHTML = '<option value="">Microphone access denied</option>';
        }
    }
}

// Test microphone
async function testMicrophone() {
    const levelContainer = document.getElementById('audio-level');
    const levelBar = document.getElementById('audio-level-bar');
    
    try {
        UI.toast('Testing microphone for 3 seconds...', 'success');
        
        const constraints = {
            audio: selectedMicrophoneId ? { deviceId: { exact: selectedMicrophoneId } } : true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set up audio analysis
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        levelContainer.classList.add('active');
        
        // Animate audio level
        const updateLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const level = Math.min(100, (average / 128) * 100);
            levelBar.style.width = level + '%';
            levelBar.classList.toggle('speaking', level > 20);
            levelAnimationFrame = requestAnimationFrame(updateLevel);
        };
        updateLevel();
        
        // Stop after 3 seconds
        setTimeout(() => {
            cancelAnimationFrame(levelAnimationFrame);
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
            levelContainer.classList.remove('active');
            levelBar.style.width = '0%';
            UI.toast('Microphone test complete!', 'success');
        }, 3000);
        
    } catch (error) {
        console.error('Microphone test failed:', error);
        UI.toast('Microphone test failed: ' + error.message, 'error');
    }
}

async function toggleVoiceRecording() {
    const voiceBtn = document.getElementById('voice-btn');
    const levelContainer = document.getElementById('audio-level');
    const levelBar = document.getElementById('audio-level-bar');
    
    if (isRecording) {
        // Stop recording
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        if (levelAnimationFrame) {
            cancelAnimationFrame(levelAnimationFrame);
        }
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close();
        }
        levelContainer.classList.remove('active');
        levelBar.style.width = '0%';
        voiceBtn.textContent = '🎤';
        voiceBtn.classList.remove('recording');
        isRecording = false;
    } else {
        // Start recording
        try {
            const constraints = {
                audio: {
                    deviceId: selectedMicrophoneId ? { exact: selectedMicrophoneId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                    channelCount: 1
                }
            };
            
            console.log('Starting recording with constraints:', constraints);
            audioStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Set up audio level monitoring
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(audioStream);
            source.connect(analyser);
            analyser.fftSize = 256;
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            levelContainer.classList.add('active');
            
            // Animate audio level
            const updateLevel = () => {
                if (!isRecording) return;
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                const level = Math.min(100, (average / 128) * 100);
                levelBar.style.width = level + '%';
                levelBar.classList.toggle('speaking', level > 20);
                levelAnimationFrame = requestAnimationFrame(updateLevel);
            };
            updateLevel();
            
            // Use WAV format for better compatibility with Whisper
            // Check for supported MIME types
            let mimeType = 'audio/webm;codecs=opus';
            if (MediaRecorder.isTypeSupported('audio/wav')) {
                mimeType = 'audio/wav';
            } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            }
            
            console.log('Using MIME type:', mimeType);
            
            mediaRecorder = new MediaRecorder(audioStream, { mimeType });
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.push(e.data);
                    console.log('Audio chunk received:', e.data.size, 'bytes');
                }
            };
            
            mediaRecorder.onstop = async () => {
                console.log('Recording stopped, processing', audioChunks.length, 'chunks');
                
                // Stop all tracks
                audioStream.getTracks().forEach(track => track.stop());
                
                if (audioChunks.length === 0) {
                    UI.toast('No audio recorded', 'error');
                    return;
                }
                
                // Create audio blob
                const audioBlob = new Blob(audioChunks, { type: mimeType });
                console.log('Audio blob size:', audioBlob.size, 'bytes');
                
                if (audioBlob.size < 1000) {
                    UI.toast('Recording too short - please speak longer', 'warning');
                    return;
                }
                
                // Show transcribing message
                const chatMessages = document.getElementById('chat-messages');
                const transcribingDiv = document.createElement('div');
                transcribingDiv.className = 'chat-message assistant';
                transcribingDiv.innerHTML = '<p>🎤 Transcribing...</p>';
                chatMessages.appendChild(transcribingDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                try {
                    // Convert to buffer and save audio file
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    console.log('Saving audio, buffer size:', arrayBuffer.byteLength);
                    
                    const saveResult = await window.api.saveAudio(Array.from(new Uint8Array(arrayBuffer)));
                    
                    if (!saveResult.success) {
                        throw new Error(saveResult.error || 'Failed to save audio');
                    }
                    
                    console.log('Audio saved to:', saveResult.filepath);
                    
                    // Transcribe the saved audio file
                    console.log('Starting transcription...');
                    const transcription = await window.api.transcribeAudio(saveResult.filepath);
                    console.log('Transcription result:', transcription);
                    
                    // Remove transcribing message
                    transcribingDiv.remove();
                    
                    // Handle transcription result
                    let transcribedText = '';
                    if (typeof transcription === 'string') {
                        transcribedText = transcription.trim();
                    } else if (transcription && transcription.text) {
                        transcribedText = transcription.text.trim();
                    } else if (transcription && transcription.success && transcription.transcription) {
                        transcribedText = transcription.transcription.trim();
                    }
                    
                    console.log('Transcribed text:', transcribedText);
                    
                    if (transcribedText && transcribedText.length > 0) {
                        // Put transcription in input and send
                        document.getElementById('chat-input').value = transcribedText;
                        UI.toast('Transcribed: ' + transcribedText.substring(0, 50) + '...', 'success');
                        await sendChatMessage();
                    } else {
                        const errorMsg = transcription?.error || 'No speech detected';
                        UI.toast('Could not transcribe: ' + errorMsg, 'warning');
                        addAssistantMessage(chatMessages, '❌ ' + errorMsg);
                    }
                } catch (error) {
                    console.error('Transcription error:', error);
                    transcribingDiv.remove();
                    UI.toast('Transcription failed: ' + error.message, 'error');
                }
            };
            
            // Start recording - collect data every 250ms
            mediaRecorder.start(250);
            voiceBtn.textContent = '⏹️';
            voiceBtn.classList.add('recording');
            isRecording = true;
            UI.toast('Recording... Click ⏹️ to stop', 'success');
            
        } catch (error) {
            console.error('Microphone access error:', error);
            if (error.name === 'NotAllowedError') {
                UI.toast('Microphone permission denied. Please allow microphone access.', 'error');
            } else if (error.name === 'NotFoundError') {
                UI.toast('No microphone found. Please connect a microphone.', 'error');
            } else {
                UI.toast('Could not access microphone: ' + error.message, 'error');
            }
        }
    }
}

// ============================================================================
// BACKUP
// ============================================================================
async function backupData() {
    const btn = document.getElementById('backup-btn');
    const originalText = btn.textContent;
    btn.textContent = '⏳';
    btn.disabled = true;
    
    try {
        if (window.api && window.api.backupData) {
            const result = await window.api.backupData();
            if (result.success) {
                UI.toast('Backup completed successfully!');
            } else {
                UI.toast('Backup failed: ' + (result.error || 'Unknown error'), 'error');
            }
        } else {
            UI.toast('Backup service not available', 'error');
        }
    } catch (error) {
        console.error('Backup failed:', error);
        UI.toast('Backup failed: ' + error.message, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // Add buttons
    document.getElementById('add-patient-btn')?.addEventListener('click', () => showPatientModal());
    document.getElementById('add-patient-btn-2')?.addEventListener('click', () => showPatientModal());
    document.getElementById('add-appointment-btn')?.addEventListener('click', () => showAppointmentModal());
    document.getElementById('add-appointment-btn-2')?.addEventListener('click', () => showAppointmentModal());
    document.getElementById('add-deadline-btn')?.addEventListener('click', () => showDeadlineModal());
    document.getElementById('add-deadline-btn-2')?.addEventListener('click', () => showDeadlineModal());
    document.getElementById('add-inventory-btn')?.addEventListener('click', () => showInventoryModal());

    // Forms
    document.getElementById('patient-form')?.addEventListener('submit', savePatient);
    document.getElementById('appointment-form')?.addEventListener('submit', saveAppointment);
    document.getElementById('deadline-form')?.addEventListener('submit', saveDeadline);
    document.getElementById('inventory-form')?.addEventListener('submit', saveInventoryItem);

    // Modal controls
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', UI.hideModals);
    });
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) UI.hideModals();
    });

    // Calendar navigation
    document.getElementById('prev-month')?.addEventListener('click', prevMonth);
    document.getElementById('next-month')?.addEventListener('click', nextMonth);
    
    // Schedule panel buttons
    document.getElementById('add-appointment-for-date')?.addEventListener('click', addAppointmentForDate);
    document.getElementById('add-deadline-for-date')?.addEventListener('click', addDeadlineForDate);
    document.getElementById('back-to-today-btn')?.addEventListener('click', backToToday);

    // Search
    document.getElementById('search-input')?.addEventListener('input', handleSearch);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            document.getElementById('search-results')?.classList.remove('show');
        }
    });

    // AI Mode Selector
    const aiModeSelect = document.getElementById('ai-mode-select');
    const chatInput = document.getElementById('chat-input');
    
    function updateChatPlaceholder() {
        if (chatInput) {
            const mode = AppState.aiMode || 'mcp';
            if (mode === 'rag') {
                chatInput.placeholder = 'Ask questions with RAG Agent (document retrieval enabled)...';
            } else {
                chatInput.placeholder = 'Type a message or use voice...';
            }
        }
    }
    
    if (aiModeSelect) {
        // Load saved preference
        const savedMode = localStorage.getItem('sundai_ai_mode') || 'mcp';
        AppState.aiMode = savedMode;
        aiModeSelect.value = savedMode;
        updateChatPlaceholder();
        
        aiModeSelect.addEventListener('change', async (e) => {
            const newMode = e.target.value;
            AppState.aiMode = newMode;
            localStorage.setItem('sundai_ai_mode', newMode);
            updateChatPlaceholder();
            
            // Update UI feedback
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                const modeName = newMode === 'mcp' ? 'MCP Chatbot' : 'RAG Agent';
                const modeDescription = newMode === 'mcp' 
                    ? 'MCP Chatbot - Tool-based actions and database operations'
                    : 'RAG Agent - Enhanced document retrieval and context-aware responses';
                addAssistantMessage(chatMessages, `🔄 **Switched to ${modeName}**\n\n${modeDescription}\n\nHow can I help you?`);
                
                // Start RAG server if switching to RAG mode
                if (newMode === 'rag' && window.api && window.api.startRagServer) {
                    try {
                        const startResult = await window.api.startRagServer();
                        if (startResult.success) {
                            console.log('✅ RAG server started');
                        } else {
                            console.warn('⚠️ RAG server start:', startResult.message || startResult.error);
                        }
                    } catch (error) {
                        console.error('❌ Failed to start RAG server:', error);
                    }
                }
            }
            
            console.log(`🔄 AI Mode changed to: ${newMode}`);
        });
    }
    
    // Chat
    document.getElementById('send-btn')?.addEventListener('click', sendChatMessage);
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    document.getElementById('voice-btn')?.addEventListener('click', toggleVoiceRecording);
    document.getElementById('test-mic-btn')?.addEventListener('click', testMicrophone);
    
    // Initialize microphones when chat view is shown
    initializeMicrophones();

    // Backup
    document.getElementById('backup-btn')?.addEventListener('click', backupData);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') UI.hideModals();
    });

    console.log('✅ Event listeners set up');
}

// ============================================================================
// INITIALIZATION
// ============================================================================
async function initializeApp() {
    console.log('🚀 Initializing SundAI...');
    
    // Check database connection
    if (Database.isConnected()) {
        console.log('✅ Database API connected');
        UI.updateConnectionStatus(true);
        
        // Test if handlers are actually working
        try {
            if (window.db && window.db.testHandler) {
                const testResult = await window.db.testHandler();
                console.log('🔍 Handler test result:', testResult);
                if (testResult && testResult.success) {
                    console.log('✅ IPC handlers are working!');
                } else {
                    console.error('❌ Handler test failed:', testResult);
                }
            }
        } catch (error) {
            console.error('❌ Handler test error:', error);
            console.error('   This means handlers are not registered properly!');
        }
    } else {
        console.warn('⚠️ Database API not available');
        UI.updateConnectionStatus(false);
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await loadDashboard();
    
    console.log('✅ App initialized');
}

// Expose functions globally for onclick handlers in dynamically created HTML
window.editPatient = editPatient;
window.deletePatient = deletePatient;
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.editDeadline = editDeadline;
window.deleteDeadline = deleteDeadline;
window.editInventoryItem = editInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;
window.selectPatient = selectPatient;
window.deleteAppointmentAndRefresh = deleteAppointmentAndRefresh;
window.deleteDeadlineAndRefresh = deleteDeadlineAndRefresh;
window.UI = UI;

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

