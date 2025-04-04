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
  
  async function fetchSponsorHeader() {
    try {
        const response = await fetch('/getSponsorData'); // Fetch sponsor details from API
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const sponsor = await response.json();
        const sponsorName = `${sponsor.first_name} ${sponsor.last_name}`;
        const sponsorAvatar = sponsor.avatar || "assets/images/avatars/11.png"; // Use default if no avatar

        // Update the header with the sponsor's name and avatar
        document.getElementById('sponsorName').textContent = `Hello, ${sponsorName}`;
        document.getElementById('sponsorAvatar').src = sponsor.profile_picture 
        ? sponsor.profile_picture 
        : '/uploads/default-avatar.png';
        document.getElementById('sponsorAvatarDropdown').src = sponsor.profile_picture 
        ? sponsor.profile_picture 
        : '/uploads/default-avatar.png';
    } catch (error) {
        console.error('Error fetching sponsor header data:', error);
    }
}

// Load sponsor header data when the page loads
document.addEventListener('DOMContentLoaded', fetchSponsorHeader);

function logoutUser() {
  // Perform logout actions if needed (e.g., clear session storage)
  localStorage.clear();
  sessionStorage.clear();

  // Redirect to login page
  window.location.href = "/login";
}

