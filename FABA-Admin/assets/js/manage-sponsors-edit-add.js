document.addEventListener('DOMContentLoaded', function () {
    // Open Add Sponsor Modal
    document.querySelector('.add-sponsor-btn').addEventListener('click', () => {
        document.getElementById('add-sponsor-modal').style.display = 'block';
        document.querySelector('.modal-content h3').textContent = 'Add Sponsor'; // Set modal title
        document.getElementById('add-sponsor-form').reset(); // Reset form
    });

    // Close Modal
    document.querySelector('.close-modal-btn').addEventListener('click', () => {
        document.getElementById('add-sponsor-modal').style.display = 'none';
    });

    // Add or Update Sponsor
    document.getElementById('add-sponsor-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const sponsorID = document.getElementById('sponsor-id').value.trim(); // Get Sponsor ID from input field
        const sponsorName = document.getElementById('sponsor-name').value.trim();
        const sponsorEmail = document.getElementById('sponsor-email').value.trim();
        const sponsorContribution = document.getElementById('sponsor-contribution').value.trim();
        const sponsorStatus = document.getElementById('sponsor-status').value.trim();

        if (!sponsorID || !sponsorName || !sponsorEmail || !sponsorContribution || !sponsorStatus) {
            alert('Please fill in all fields');
            return;
        }

        const tbody = document.getElementById('sponsor-tbody');
        const isEditing = document.querySelector('.modal-content h3').textContent === 'Edit Sponsor';
        let row;

        if (isEditing) {
            row = document.querySelector('.editing-row'); // Find row being edited
            row.classList.remove('editing-row');
        } else {
            row = document.createElement('tr');
        }

        row.innerHTML = `
            <td><input type="checkbox" class="select-sponsor"></td>
            <td>${sponsorID}</td>
            <td>${sponsorName}</td>
            <td>${sponsorEmail}</td>
            <td>₹${sponsorContribution}</td>
            <td><span class="status ${sponsorStatus.toLowerCase()}">${sponsorStatus.charAt(0).toUpperCase() + sponsorStatus.slice(1)}</span></td>
            <td>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </td>
        `;

        if (!isEditing) tbody.appendChild(row);

        attachRowActions(row);
        document.getElementById('add-sponsor-modal').style.display = 'none';
    });

    // Attach Actions to a Row
    function attachRowActions(row) {
        row.querySelector('.edit-btn').addEventListener('click', () => {
            const sponsorID = row.cells[1].textContent;
            const sponsorName = row.cells[2].textContent;
            const sponsorEmail = row.cells[3].textContent;
            const sponsorContribution = row.cells[4].textContent.replace('₹', '');
            const sponsorStatus = row.querySelector('.status').textContent.toLowerCase();

            document.getElementById('sponsor-id').value = sponsorID;
            document.getElementById('sponsor-name').value = sponsorName;
            document.getElementById('sponsor-email').value = sponsorEmail;
            document.getElementById('sponsor-contribution').value = sponsorContribution;
            document.getElementById('sponsor-status').value = sponsorStatus;

            row.classList.add('editing-row');
            document.querySelector('.modal-content h3').textContent = 'Edit Sponsor';
            document.getElementById('add-sponsor-modal').style.display = 'block';
        });

        row.querySelector('.delete-btn').addEventListener('click', () => {
            row.remove();
        });
    }

    // Initialize Actions for Existing Rows
    document.querySelectorAll('#sponsor-tbody tr').forEach(attachRowActions);

    // Search by Name or ID
    document.querySelector('.search-bar').addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#sponsor-tbody tr');
        rows.forEach((row) => {
            const sponsorID = row.cells[1].textContent.toLowerCase();
            const sponsorName = row.cells[2].textContent.toLowerCase();
            if (sponsorID.includes(searchTerm) || sponsorName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });

    // Filter by Contribution Status
    document.querySelector('.filter-dropdown').addEventListener('change', function () {
        const filterStatus = this.value.toLowerCase();
        const rows = document.querySelectorAll('#sponsor-tbody tr');
        rows.forEach((row) => {
            const status = row.querySelector('.status').textContent.toLowerCase();
            if (filterStatus === '' || status === filterStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.querySelector('.search-bar');

    // Function to search sponsors by Name or ID
    function searchSponsors() {
        const searchTerm = searchBar.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#sponsor-tbody tr');

        rows.forEach((row) => {
            const sponsorID = row.cells[1].textContent.toLowerCase();
            const sponsorName = row.cells[2].textContent.toLowerCase();

            if (sponsorID.includes(searchTerm) || sponsorName.includes(searchTerm)) {
                row.style.display = ''; // Show the row if match is found
            } else {
                row.style.display = 'none'; // Hide the row if no match
            }
        });

        if (searchTerm === '') {
            rows.forEach((row) => {
                row.style.display = ''; // Show all rows if search bar is empty
            });
        }
    }

    // Trigger search as user types
    searchBar.addEventListener('input', searchSponsors);
});
