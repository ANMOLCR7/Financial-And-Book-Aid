document.addEventListener('DOMContentLoaded', function() {
    // Handle View Details button click
    const viewDetailsButtons = document.querySelectorAll('.view-details');
    
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = button.closest('.contribution-card'); // Get the closest .contribution-card div
            const studentName = card.querySelector('h4').textContent.split(': ')[1]; // Extract student name
            const requestedAmount = card.querySelector('p').textContent.split(': $')[1]; // Extract requested amount
            
            // Display details in an alert
            alert(`Request Details:\nStudent: ${studentName}\nRequested Amount: $${requestedAmount}`);
        });
    });
});
