async function fetchNewRequests() {
  try {
    const response = await fetch('/api/new-requests');
    const data = await response.json();

    const notifyList = document.querySelector('.notify-list');
    notifyList.innerHTML = ''; // Clear previous notifications

    if (data.length > 0) {
      data.forEach(request => {
        const listItem = document.createElement('div');
        listItem.classList.add('dropdown-item', 'd-flex', 'align-items-center', 'gap-2', 'py-2');

        listItem.innerHTML = `
          <i class="material-icons-outlined text-primary">person</i>
          <span><strong>${request.student_name}</strong> requested ₹${request.amount_requested}</span>
        `;
        notifyList.appendChild(listItem);
      });
    } else {
      notifyList.innerHTML = '<div class="text-center py-2">No new requests</div>';
    }

  } catch (error) {
    console.error('Error fetching new requests:', error);
  }
}

// 🔄 Fetch new requests every 10 seconds
setInterval(fetchNewRequests, 10000);
fetchNewRequests(); // Initial load

async function fetchNotifications() {
  try {
    const response = await fetch('/api/new-requests');
    const data = await response.json();
    
    const notificationCount = data.length; // Count pending requests
    const badge = document.querySelector('.badge-notify');

    if (notificationCount > 0) {
      badge.innerText = notificationCount; // Update the notification count
      badge.style.display = "inline-block"; // Show badge
    } else {
      badge.style.display = "none"; // Hide badge if no notifications
    }

  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
}

// Call function when the page loads
fetchNotifications();