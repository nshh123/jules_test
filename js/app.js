let appState = [];
let currentLecturerId = null;

const APP_VERSION = "2.0";

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  // ... rest of event listeners ...

  const searchBar = document.getElementById("searchBar");
  searchBar.addEventListener("input", handleSearch);

  const reviewForm = document.getElementById("reviewForm");
  reviewForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const studentName = document.getElementById("studentName").value;
    const rating = parseInt(document.getElementById("rating").value);
    const comment = document.getElementById("comment").value;

    if (!studentName || !rating || !comment) return;

    // Find and update lecturer
    appState.forEach((faculty) => {
      const lecturer = faculty.lecturers.find((l) => l.id === currentLecturerId);
      if (lecturer) {
        lecturer.reviews.push({
          student: studentName,
          rating: rating,
          comment: comment,
        });
      }
    });

    saveState();
    renderLecturers(appState);
    closeModal();
  });

  // Close modal on outside click
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("reviewModal");
    if (e.target === modal) {
      closeModal();
    }
  });
});

async function initApp() {
  const savedVersion = localStorage.getItem("guide_app_version");
  const savedData = localStorage.getItem("guide_app_data");

  if (savedData && savedVersion === APP_VERSION) {
    appState = JSON.parse(savedData);
    renderLecturers(appState);
  } else {
    try {
      const res = await fetch("data/lecturers.json");
      const data = await res.json();
      appState = data.faculties;
      saveState();
      renderLecturers(appState);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }
}

function saveState() {
  localStorage.setItem("guide_app_data", JSON.stringify(appState));
  localStorage.setItem("guide_app_version", APP_VERSION);
}

function getStarRating(rating) {
  const rounded = Math.round(rating);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

function renderLecturers(faculties) {
  const container = document.getElementById("lecturerList");
  container.innerHTML = "";

  if (faculties.length === 0) {
    container.innerHTML = `<div class="no-results">No lecturers found matching your search.</div>`;
    return;
  }

  faculties.forEach((faculty) => {
    const facultySection = document.createElement("section");
    facultySection.classList.add("faculty");

    const title = document.createElement("h2");
    title.textContent = faculty.name;
    facultySection.appendChild(title);

    const grid = document.createElement("div");
    grid.classList.add("lecturer-grid");

    faculty.lecturers.forEach((lecturer) => {
      const lecturerCard = document.createElement("div");
      lecturerCard.classList.add("lecturer-card");

      const avg = getAverageRating(lecturer.reviews);
      const starDisplay = typeof avg === "number" ? getStarRating(avg) : avg;

      lecturerCard.innerHTML = `
        <div class="card-header">
          <img src="${lecturer.image}" alt="${lecturer.name}" class="profile-pic">
          <div class="header-info">
            <h3>${lecturer.name}</h3>
            <p class="courses">${lecturer.courses.join(", ")}</p>
          </div>
        </div>
        
        <div class="card-body">
          <div class="rating-box">
             <span class="stars">${starDisplay}</span>
             <span class="rating-num">${typeof avg === "number" ? avg : ""}</span>
          </div>
          
          <div class="reviews-preview">
            ${lecturer.reviews.length > 0 
              ? `<p class="latest-review">"${lecturer.reviews[lecturer.reviews.length - 1].comment.substring(0, 60)}..."</p>`
              : '<p class="no-reviews">No reviews yet. Be the first!</p>'}
          </div>
        </div>

        <div class="card-footer">
          <button class="btn-add-review" onclick="openModal(${lecturer.id})">Review Lecturer</button>
        </div>
      `;

      grid.appendChild(lecturerCard);
    });

    facultySection.appendChild(grid);
    container.appendChild(facultySection);
  });
}

function getAverageRating(reviews) {
  if (reviews.length === 0) return "No ratings yet";
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return parseFloat((total / reviews.length).toFixed(1));
}

function handleSearch(e, data) {
  const query = e.target.value.toLowerCase();
  const filtered = appState
    .map((faculty) => {
      return {
        ...faculty,
        lecturers: faculty.lecturers.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            faculty.name.toLowerCase().includes(query) ||
            l.courses.some((c) => c.toLowerCase().includes(query))
        ),
      };
    })
    .filter((f) => f.lecturers.length > 0);

  renderLecturers(filtered);
}

// Modal Logic
function openModal(lecturerId) {
  currentLecturerId = lecturerId;
  const modal = document.getElementById("reviewModal");
  modal.style.display = "flex";
}

function closeModal() {
  currentLecturerId = null;
  const modal = document.getElementById("reviewModal");
  modal.style.display = "none";
  document.getElementById("reviewForm").reset();
}
