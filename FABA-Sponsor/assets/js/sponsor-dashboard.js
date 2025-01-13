document.addEventListener('DOMContentLoaded', function() {
    // Function to add activity
    function addActivity(activity) {
        const recentActivitiesSection = document.querySelector('.recent-activities');
        const activityCard = document.createElement('div');
        activityCard.classList.add('activity-card');
        activityCard.innerHTML = `<p><strong>${activity}</strong></p>`;
        recentActivitiesSection.appendChild(activityCard);
    }

    // Approve, Reject and View Details event listeners
    document.querySelectorAll('.action-buttons button').forEach((button, index) => {
        button.addEventListener('click', function() {
            const card = button.closest('.card');  // Get the closest .card div
            const studentName = card.querySelector('p:nth-child(2)').textContent.split(': ')[1]; // Extract student name
            const amount = card.querySelector('p:nth-child(3)').textContent.split(': $')[1]; // Extract amount
            const urgency = card.querySelector('p:nth-child(4)').textContent.split(': ')[1]; // Extract urgency
            
            if (button.textContent === 'Approve') {
                addActivity(`Request from ${studentName} of $${amount} was approved.`);
            } else if (button.textContent === 'Reject') {
                addActivity(`Request from ${studentName} of $${amount} was rejected.`);
            } else if (button.textContent === 'View Details') {
                alert(`Request Details:\nStudent: ${studentName}\nAmount: $${amount}\nUrgency: ${urgency}`);
            }
        });
    });
});
