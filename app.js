// ===============================
// API URLs
// ===============================
const CATEGORIES_API = "https://www.themealdb.com/api/json/v1/1/categories.php";
const SEARCH_API = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const FILTER_API = "https://www.themealdb.com/api/json/v1/1/filter.php?c=";
const DETAILS_API = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";

// ===============================
// ELEMENTS
// ===============================
const toggleBtn = document.getElementById("toggleBtn");
const closeBtn = document.getElementById("closeBtn");
const sidebar = document.getElementById("sidebar");
const categoryListEl = document.getElementById("categoryList");
const sideListEl = document.getElementById("sideList");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const sectionHeaderTitle = document.querySelector(".section-header h2");

// ===============================
// SIDEBAR
// ===============================
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    if (sidebar) sidebar.classList.add("open");
  });
}
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    if (sidebar) sidebar.classList.remove("open");
  });
}
document.addEventListener("click", (e) => {
  if (!sidebar) return;
  if (!sidebar.contains(e.target) && !e.target.closest(".icon-btn")) {
    sidebar.classList.remove("open");
  }
});

// ===============================
// HELPERS
// ===============================
function slugEquals(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

// Generate a meal card for search + category
function mealCard(meal, categoryName = "") {
  const badge = categoryName
    ? `<div class="badge">${categoryName}</div>`
    : meal.strCategory
    ? `<div class="badge">${meal.strCategory}</div>`
    : "";

  return `
    <div class="card" onclick="openMeal('${meal.idMeal}')">
      ${badge}
      <img src="${meal.strMealThumb}" loading="lazy" />
      <p>${meal.strMeal}</p>
    </div>
  `;
}

// ===============================
// NAVIGATION HELPERS
// ===============================
function openCategory(name) {
  window.location.href = `category.html?c=${encodeURIComponent(name)}`;
}
window.openCategory = openCategory;

function openMeal(id) {
  window.location.href = `meal.html?id=${encodeURIComponent(id)}`;
}
window.openMeal = openMeal;

// ===============================
// LOAD CATEGORIES ON HOMEPAGE
// ===============================
async function loadCategories() {
  try {
    const res = await fetch(CATEGORIES_API);
    const data = await res.json();
    const categories = data.categories;

    if (categoryListEl) {
      categoryListEl.innerHTML = "";
      categories.forEach((c) => {
        categoryListEl.innerHTML += `
          <div class="card" onclick="openCategory('${c.strCategory}')">
            <div class="badge">${c.strCategory}</div>
            <img src="${c.strCategoryThumb}" />
            <p>${c.strCategory}</p>
          </div>`;
      });
    }

    if (sideListEl) {
      sideListEl.innerHTML = "";
      categories.forEach((c) => {
        let li = document.createElement("li");
        li.textContent = c.strCategory;
        li.onclick = () => openCategory(c.strCategory);
        sideListEl.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Category load error:", err);
  }
}

// ===============================
// SEARCH ON HOMEPAGE
// ===============================
if (searchBtn) {
  searchBtn.onclick = () => {
    const q = searchInput.value.trim();
    if (q) doSearch(q);
  };

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchBtn.click();
  });
}

async function doSearch(text) {
  try {
    const res = await fetch(SEARCH_API + encodeURIComponent(text));
    const data = await res.json();
    const meals = data.meals;

    // Change header to "MEALS"
    if (sectionHeaderTitle) sectionHeaderTitle.textContent = "MEALS";

    // Style grid as meal grid
    categoryListEl.classList.add("grid-cards");
    categoryListEl.innerHTML = "";

    if (!meals) {
      categoryListEl.innerHTML = "<p>No meals found.</p>";
      return;
    }

    meals.forEach((meal) => {
      categoryListEl.innerHTML += mealCard(meal);
    });

    categoryListEl.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error("Search error:", err);
  }
}

// ===============================
// CATEGORY PAGE
// ===============================
async function loadMealsByCategory() {
  const titleEl = document.getElementById("catTitle");
  const descEl = document.getElementById("catDesc");
  const listEl = document.getElementById("mealList");
  if (!titleEl || !descEl || !listEl) return;

  const params = new URLSearchParams(window.location.search);
  const categoryName = params.get("c");
  titleEl.textContent = categoryName;

  // Load description
  try {
    const resCat = await fetch(CATEGORIES_API);
    const catData = await resCat.json();

    const match = catData.categories.find((c) =>
      slugEquals(c.strCategory, categoryName)
    );

    if (match) {
      descEl.innerHTML = `
        <div class="desc-box">
          <h4 class="desc-title">${match.strCategory}</h4>
          <p class="desc-text">${match.strCategoryDescription}</p>
        </div>`;
    }
  } catch (err) {
    descEl.innerHTML = "No description available.";
  }

  // Load meals in category
  try {
    const res = await fetch(FILTER_API + encodeURIComponent(categoryName));
    const data = await res.json();
    const meals = data.meals;

    listEl.innerHTML = "";
    meals.forEach((m) => {
      listEl.innerHTML += mealCard(m, categoryName);
    });
  } catch (err) {
    console.error("Category meals error:", err);
  }
}

// ===============================
// MEAL DETAILS PAGE
// ===============================
async function loadMealDetails() {
  const detailsEl = document.getElementById("mealDetails");
  if (!detailsEl) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  try {
    const res = await fetch(DETAILS_API + id);
    const data = await res.json();
    const meal = data.meals[0];

    // Set mini header title
    const miniTitle = document.getElementById("miniTitle");
    if (miniTitle) miniTitle.textContent = meal.strMeal;

    // Ensure mini logo goes home
    const miniLogo = document.getElementById("miniLogo");
    if (miniLogo) {
      miniLogo.onclick = () => (window.location.href = "index.html");
    }

    // Ensure top logo goes home
    const topLogo = document.querySelector(".navbar .logo");
    if (topLogo) {
      topLogo.onclick = () => (window.location.href = "index.html");
    }

    // Ingredients
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing) ingredients.push({ ing, measure });
    }

    // Build HTML
    detailsEl.innerHTML = `
      <div class="meal-left">
        <img src="${meal.strMealThumb}" />
      </div>

      <div class="meal-right">
        <h3>${meal.strMeal}</h3>
        <div class="meal-meta"><strong>Category:</strong> ${meal.strCategory}</div>

        <div class="ingredients">
          <div style="font-weight:700;">Ingredients</div>
          <div class="ing-list">
            ${ingredients
              .map((i) => `<div class="ing"><i class="fa-solid fa-circle"></i>${i.ing}</div>`)
              .join("")}
          </div>
        </div>
      </div>

      <div class="full-width-box">
        <div class="measure-box">
          <div style="font-weight:700;">Measure:</div>
          <div class="measure-row">
            ${ingredients
              .map((i) => `<div>${i.measure} <span style="color:#e86528">•</span> ${i.ing}</div>`)
              .join("")}
          </div>
        </div>

        <div class="instructions">
          <div style="font-weight:700;">Instructions:</div>
          <ul>
            ${meal.strInstructions
              .split("\n")
              .filter(Boolean)
              .map(
                (step) =>
                  `<li><span class="tick"><i class="fa-solid fa-check"></i></span>${step}</li>`
              )
              .join("")}
          </ul>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Meal details error:", err);
  }
}

// ===============================
// INITIALIZER
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();

  if (document.getElementById("mealList")) loadMealsByCategory();
  if (document.getElementById("mealDetails")) loadMealDetails();
});