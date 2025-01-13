document.addEventListener('DOMContentLoaded', function() {
    // Search by name
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', function() {
        const searchText = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll('#requests-list tr');
        
        rows.forEach(row => {
            const studentName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            if (studentName.includes(searchText)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });

    // Handle action buttons (Approve, Reject, View Details)
    const actionButtons = document.querySelectorAll('#requests-list button');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = button.closest('tr');
            const studentName = row.querySelector('td:nth-child(2)').textContent;
            const amount = row.querySelector('td:nth-child(4)').textContent;
            const requestType = row.querySelector('td:nth-child(3)').textContent;

            if (button.textContent.includes('Approve')) {
                alert(`Request from ${studentName} for ${requestType} of ${amount} has been approved.`);
            } else if (button.textContent.includes('Reject')) {
                alert(`Request from ${studentName} for ${requestType} of ${amount} has been rejected.`);
            } else if (button.textContent.includes('View Details')) {
                alert(`Details:\nStudent: ${studentName}\nRequest Type: ${requestType}\nAmount: ${amount}`);
            }
        });
    });
});
