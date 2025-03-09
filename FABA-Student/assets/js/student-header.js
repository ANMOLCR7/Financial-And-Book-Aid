function updateTime() {
      const timeElement = document.getElementById("current-time");
      const now = new Date();
      timeElement.textContent = now.toLocaleTimeString();
    }
    
    function updateDate() {
      const dateElement = document.getElementById("current-date");
      const now = new Date();
      dateElement.textContent = now.toLocaleDateString();
    }
    
    setInterval(updateTime, 1000);
    updateTime();
    updateDate();

    document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector(".search-bar input");

    searchInput.addEventListener("keyup", function () {
      let filter = searchInput.value.toLowerCase().trim();
      let items = document.querySelectorAll(".searchable-item");

      items.forEach(item => {
        let text = item.textContent.toLowerCase();
        if (text.includes(filter)) {
          item.style.display = "block"; // Show matching items
        } else {
          item.style.display = "none"; // Hide non-matching items
        }
      });
    });
  });