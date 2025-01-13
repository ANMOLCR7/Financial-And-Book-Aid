document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('book-requests-tbody');
    const storageKey = 'bookRequestsData';
    const summaryElements = {
        total: document.getElementById('total-book-requests'),
        approved: document.getElementById('approved-book-requests'),
        pending: document.getElementById('pending-book-requests'),
        rejected: document.getElementById('rejected-book-requests')
    };

    // Load saved data from LocalStorage
    let savedData = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Function to render the table with saved data
    function renderTable() {
        tableBody.innerHTML = ''; // Clear existing rows
        savedData.forEach((rowData) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${rowData.requestId}</td>
                <td>${rowData.bookTitle}</td>
                <td>${rowData.studentName}</td>
                <td><span class="status ${rowData.status.toLowerCase()}">${rowData.status}</span></td>
                <td>
                    <button class="approve-btn">Approve</button>
                    <button class="reject-btn">Reject</button>
                    <button class="details-btn">Details</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        attachEventListeners();
        updateSummary();
    }

    // Save data to LocalStorage
    function saveData() {
        localStorage.setItem(storageKey, JSON.stringify(savedData));
    }

    // Attach event listeners to the table buttons
    function attachEventListeners() {
        // Approve button
        document.querySelectorAll('.approve-btn').forEach((button, index) => {
            button.addEventListener('click', () => {
                savedData[index].status = 'Approved';
                saveData();
                renderTable();
            });
        });

        // Reject button
        document.querySelectorAll('.reject-btn').forEach((button, index) => {
            button.addEventListener('click', () => {
                savedData[index].status = 'Rejected';
                saveData();
                renderTable();
            });
        });

        // Details button
        document.querySelectorAll('.details-btn').forEach((button, index) => {
            button.addEventListener('click', () => {
                const rowData = savedData[index];
                alert(`Details for Request ID: ${rowData.requestId}\nBook Title: ${rowData.bookTitle}\nStudent Name: ${rowData.studentName}\nStatus: ${rowData.status}`);
            });
        });
    }

    // Update summary function
    function updateSummary() {
        const totalRequests = document.querySelectorAll('#book-requests-tbody tr').length;
        const approvedRequests = document.querySelectorAll('.status.approved').length;
        const pendingRequests = document.querySelectorAll('.status.pending').length;
        const rejectedRequests = document.querySelectorAll('.status.rejected').length;

        summaryElements.total.textContent = totalRequests;
        summaryElements.approved.textContent = approvedRequests;
        summaryElements.pending.textContent = pendingRequests;
        summaryElements.rejected.textContent = rejectedRequests;
    }

    // Select all checkbox functionality
    document.getElementById('select-all').addEventListener('change', function (e) {
        const checkboxes = document.querySelectorAll('#book-requests-tbody input[type="checkbox"]');
        checkboxes.forEach((checkbox) => (checkbox.checked = e.target.checked));
    });

    // Bulk Approve Functionality
    document.querySelector('.bulk-approve-btn').addEventListener('click', () => {
        const selectedRows = document.querySelectorAll('#book-requests-tbody input[type="checkbox"]:checked');
        selectedRows.forEach((row) => {
            const status = row.closest('tr').querySelector('.status');
            status.textContent = 'Approved';
            status.className = 'status approved';
        });
        updateSummary();
    });

    // Bulk Reject Functionality
    document.querySelector('.bulk-reject-btn').addEventListener('click', () => {
        const selectedRows = document.querySelectorAll('#book-requests-tbody input[type="checkbox"]:checked');
        selectedRows.forEach((row) => {
            const status = row.closest('tr').querySelector('.status');
            status.textContent = 'Rejected';
            status.className = 'status rejected';
        });
        updateSummary();
    });

    // Search Functionality
    document.querySelector('.search-bar').addEventListener('input', function (e) {
        const searchValue = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#book-requests-tbody tr');

        rows.forEach((row) => {
            const bookTitle = row.children[2].textContent.toLowerCase(); // Book Title
            const studentName = row.children[3].textContent.toLowerCase(); // Student Name

            if (bookTitle.includes(searchValue) || studentName.includes(searchValue)) {
                row.style.display = ''; // Show row
            } else {
                row.style.display = 'none'; // Hide row
            }
        });
    });

    // Individual Approve and Reject Buttons
    document.querySelectorAll('.approve-btn').forEach((button) => {
        button.addEventListener('click', function () {
            const status = this.closest('tr').querySelector('.status');
            status.textContent = 'Approved';
            status.className = 'status approved';
            updateSummary();
        });
    });

    document.querySelectorAll('.reject-btn').forEach((button) => {
        button.addEventListener('click', function () {
            const status = this.closest('tr').querySelector('.status');
            status.textContent = 'Rejected';
            status.className = 'status rejected';
            updateSummary();
        });
    });

    // Initialize table with saved data or default rows
    if (savedData.length === 0) {
        // Example default data
        savedData.push(
            { requestId: 'BR001', bookTitle: 'Introduction to Algorithms', studentName: 'John Doe', status: 'Pending' },
            { requestId: 'BR002', bookTitle: 'Clean Code', studentName: 'Jane Smith', status: 'Approved' }
        );
        saveData();
    }

    // Render the table
    renderTable();
});