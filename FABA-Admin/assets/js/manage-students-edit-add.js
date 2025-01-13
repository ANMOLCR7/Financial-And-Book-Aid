// Get modal and buttons
const addStudentBtn = document.querySelector('.add-student-btn');
const addStudentModal = document.getElementById('addStudentModal');
const closeModalBtn = document.getElementById('closeModal');
const addStudentForm = document.getElementById('addStudentForm');
const tableBody = document.querySelector('.student-table tbody');
const searchBar = document.querySelector('.search-bar');
const filterDropdown = document.querySelector('.filter-dropdown');

// Variables to track editing mode
let isEditing = false;
let currentRow = null;

// Load data from localStorage
function loadStudentsFromLocalStorage() {
    const students = getStudentsFromLocalStorage();
    renderTable(students);
}

// Save data to localStorage
function saveStudentsToLocalStorage(students) {
    localStorage.setItem('students', JSON.stringify(students));
}

// Get students from localStorage
function getStudentsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('students')) || [];
}

// Render table rows
function renderTable(students) {
    tableBody.innerHTML = ''; // Clear existing table rows
    students.forEach((student, index) => {
        addStudentToTable(student, index);
    });
}

// Add student to table
function addStudentToTable(student, index) {
    const newRow = document.createElement('tr');
    newRow.dataset.index = index; // Store index for editing/deleting
    newRow.innerHTML = `
        <td>${student.id}</td>
        <td>${student.name}</td>
        <td>${student.email}</td>
        <td><span class="status ${student.status}">${student.status.charAt(0).toUpperCase() + student.status.slice(1)}</span></td>
        <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;
    tableBody.appendChild(newRow);
}

// Show modal for adding a student
addStudentBtn.addEventListener('click', () => {
    addStudentModal.style.display = 'block';
    addStudentForm.reset();
    isEditing = false; // Reset editing mode
});

// Close modal
closeModalBtn.addEventListener('click', () => {
    addStudentModal.style.display = 'none';
});

// Add or Edit student functionality
addStudentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form values
    const studentID = document.getElementById('studentID').value.trim();
    const studentName = document.getElementById('studentName').value.trim();
    const studentEmail = document.getElementById('studentEmail').value.trim();
    const studentStatus = document.getElementById('studentStatus').value;

    const students = getStudentsFromLocalStorage();

    if (isEditing && currentRow) {
        // Update existing student
        const index = currentRow.dataset.index;
        students[index] = { id: studentID, name: studentName, email: studentEmail, status: studentStatus };
        saveStudentsToLocalStorage(students);

        // Update table row
        currentRow.cells[0].textContent = studentID;
        currentRow.cells[1].textContent = studentName;
        currentRow.cells[2].textContent = studentEmail;
        currentRow.cells[3].innerHTML = `<span class="status ${studentStatus}">${studentStatus.charAt(0).toUpperCase() + studentStatus.slice(1)}</span>`;
        isEditing = false;
        currentRow = null;
    } else {
        // Add new student
        const newStudent = { id: studentID, name: studentName, email: studentEmail, status: studentStatus };
        students.push(newStudent);
        saveStudentsToLocalStorage(students);

        // Render updated table
        renderTable(students);
    }

    // Reset form and close modal
    addStudentForm.reset();
    addStudentModal.style.display = 'none';
});

// Handle Edit and Delete buttons dynamically
tableBody.addEventListener('click', (e) => {
    const target = e.target;

    let students = getStudentsFromLocalStorage();

    if (target.classList.contains('edit-btn')) {
        // Edit functionality
        currentRow = target.closest('tr');
        const index = currentRow.dataset.index;
        const student = students[index];

        // Fill the form with current row data
        document.getElementById('studentID').value = student.id;
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentEmail').value = student.email;
        document.getElementById('studentStatus').value = student.status;

        // Show modal and set editing mode
        addStudentModal.style.display = 'block';
        isEditing = true;
        currentRow.dataset.index = index;
    }

    if (target.classList.contains('delete-btn')) {
        // Delete functionality
        const row = target.closest('tr');
        const index = parseInt(row.dataset.index);

        // Remove student from the array
        students.splice(index, 1);

        // Save updated students array to localStorage
        saveStudentsToLocalStorage(students);

        // Reload the table
        renderTable(students);
    }
});

// Search functionality
searchBar.addEventListener('input', () => {
    const searchTerm = searchBar.value.toLowerCase().trim();
    const students = getStudentsFromLocalStorage();

    const filteredStudents = students.filter((student) => {
        return student.id.toLowerCase().includes(searchTerm) || student.name.toLowerCase().includes(searchTerm);
    });

    renderTable(filteredStudents);
});

// Filter functionality
filterDropdown.addEventListener('change', () => {
    const filterValue = filterDropdown.value.toLowerCase();
    const students = getStudentsFromLocalStorage();

    const filteredStudents = filterValue
        ? students.filter((student) => student.status.toLowerCase() === filterValue)
        : students;

    renderTable(filteredStudents);
});

// Load students on page load
document.addEventListener('DOMContentLoaded', loadStudentsFromLocalStorage);
