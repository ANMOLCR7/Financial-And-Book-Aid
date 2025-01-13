// Utility to update summary counts
function updateSummary() {
    const totalRequests = document.querySelectorAll('#requests-tbody tr').length;
    const approvedRequests = document.querySelectorAll('.status.approved').length;
    const pendingRequests = document.querySelectorAll('.status.pending').length;
    const rejectedRequests = document.querySelectorAll('.status.rejected').length;

    document.getElementById('total-requests').textContent = totalRequests;
    document.getElementById('approved-requests').textContent = approvedRequests;
    document.getElementById('pending-requests').textContent = pendingRequests;
    document.getElementById('rejected-requests').textContent = rejectedRequests;
}

// Bulk Approve selected requests
function bulkApprove() {
    const selectedRows = document.querySelectorAll('#requests-tbody input[type="checkbox"]:checked');
    selectedRows.forEach((row) => {
        const status = row.closest('tr').querySelector('.status');
        if (!status.classList.contains('approved')) {
            status.textContent = 'Approved';
            status.className = 'status approved';
        }
    });
    updateSummary();
}

// Bulk Reject selected requests
function bulkReject() {
    const selectedRows = document.querySelectorAll('#requests-tbody input[type="checkbox"]:checked');
    selectedRows.forEach((row) => {
        const status = row.closest('tr').querySelector('.status');
        if (!status.classList.contains('rejected')) {
            status.textContent = 'Rejected';
            status.className = 'status rejected';
        }
    });
    updateSummary();
}

// Individual Approve action
function approveRequest(button) {
    const row = button.closest('tr');
    const status = row.querySelector('.status');
    if (!status.classList.contains('approved')) {
        status.textContent = 'Approved';
        status.className = 'status approved';
        updateSummary();
    }
}

// Individual Reject action
function rejectRequest(button) {
    const row = button.closest('tr');
    const status = row.querySelector('.status');
    if (!status.classList.contains('rejected')) {
        status.textContent = 'Rejected';
        status.className = 'status rejected';
        updateSummary();
    }
}

// Show Details of a Request
function showDetails(button) {
    const row = button.closest('tr');
    const requestId = row.children[1].textContent;
    const studentName = row.children[2].textContent;
    const amount = row.children[3].textContent;
    const status = row.querySelector('.status').textContent;

    alert(`Details for Request ID: ${requestId}\nStudent Name: ${studentName}\nAmount: ${amount}\nStatus: ${status}`);
}

// Select/Deselect all rows
document.getElementById('select-all').addEventListener('change', function (e) {
    const checkboxes = document.querySelectorAll('#requests-tbody input[type="checkbox"]');
    checkboxes.forEach((checkbox) => (checkbox.checked = e.target.checked));
});

// Event Listeners for Bulk Actions
document.querySelector('.bulk-approve-btn').addEventListener('click', bulkApprove);
document.querySelector('.bulk-reject-btn').addEventListener('click', bulkReject);

// Attach Individual Row Action Listeners
document.querySelectorAll('.approve-btn').forEach((button) => {
    button.addEventListener('click', () => approveRequest(button));
});

document.querySelectorAll('.reject-btn').forEach((button) => {
    button.addEventListener('click', () => rejectRequest(button));
});

document.querySelectorAll('.details-btn').forEach((button) => {
    button.addEventListener('click', () => showDetails(button));
});

// Update summary counts on page load
document.addEventListener('DOMContentLoaded', updateSummary);

//search Funtion
document.querySelector('.search-bar').addEventListener('input', function (e) {
    const searchValue = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#requests-tbody tr');

    rows.forEach((row) => {
        const requestId = row.children[1].textContent.toLowerCase(); // Request ID
        const studentName = row.children[2].textContent.toLowerCase(); // Student Name

        if (requestId.includes(searchValue) || studentName.includes(searchValue)) {
            row.style.display = ''; // Show row
        } else {
            row.style.display = 'none'; // Hide row
        }
    });
});
