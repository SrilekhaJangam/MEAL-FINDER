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
const crumbText = document.getElementById("crumbText");


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

  
  const thumb = meal.strMealThumb || meal.strCategoryThumb || "";
  const title = meal.strMeal || meal.strCategory || "";

  return `
    <div class="card" onclick="openMeal('${meal.idMeal || ""}')">
      ${badge}
      <img src="${thumb}" loading="lazy" alt="${title}" />
      <p>${title}</p>
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
  if (!id) return;
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
    const categories = data.categories || [];

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
    const q = (searchInput && searchInput.value || "").trim();
    if (q) doSearch(q);
  };

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchBtn.click();
    });
  }
}

async function doSearch(text) {
  try {
    const res = await fetch(SEARCH_API + encodeURIComponent(text));
    const data = await res.json();
    const meals = data.meals;

    // Change header to "MEALS"
    if (sectionHeaderTitle) sectionHeaderTitle.textContent = "MEALS";

    // Style grid as meal grid
    if (categoryListEl) categoryListEl.classList.add("grid-cards");
    if (!categoryListEl) return;

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
  titleEl.textContent = categoryName || "";

  // Load description
  try {
    const resCat = await fetch(CATEGORIES_API);
    const catData = await resCat.json();

    const match = (catData.categories || []).find((c) =>
      slugEquals(c.strCategory, categoryName)
    );

    if (match) {
      descEl.innerHTML = `
        <div class="desc-box">
          <h4 class="desc-title">${match.strCategory}</h4>
          <p class="desc-text">${match.strCategoryDescription}</p>
        </div>`;
    } else {
      descEl.innerHTML = "No description available.";
    }
  } catch (err) {
    descEl.innerHTML = "No description available.";
  }

  // Load meals in category
  try {
    const res = await fetch(FILTER_API + encodeURIComponent(categoryName));
    const data = await res.json();
    const meals = data.meals || [];

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
  if (!id) return;

  try {
    const res = await fetch(DETAILS_API + encodeURIComponent(id));
    const data = await res.json();
    if (!data || !data.meals) return;
    const meal = data.meals[0];

    // Update crumb & mini title
    if (crumbText) crumbText.textContent = meal.strMeal || "";
    const miniTitle = document.getElementById("miniTitle");
    if (miniTitle) miniTitle.textContent = meal.strMeal || "";

    // Home links
    const miniLogo = document.getElementById("miniLogo");
    if (miniLogo) miniLogo.onclick = () => (window.location.href = "index.html");
    const topLogo = document.querySelector(".navbar .logo");
    if (topLogo) topLogo.onclick = () => (window.location.href = "index.html");

    // Ingredients + measures
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim()) ingredients.push({ key: i, ing: ing.trim(), measure: (measure||'').trim() });
    }

    // Tags (comma separated in API)
    const tags = (meal.strTags || "").split(",").map(t => t.trim()).filter(Boolean);

    // Short/truncated source link to display (prefer strSource, fallback to youtube)
    const sourceUrl = meal.strSource || meal.strYoutube || "";
    const shortSource = sourceUrl ? (sourceUrl.length > 40 ? sourceUrl.slice(0, 38) + "..." : sourceUrl) : "";

    // Build HTML
    detailsEl.innerHTML = `
      <div class="meal-left">
        <img src="${meal.strMealThumb || ''}" alt="${meal.strMeal || ''}" />
      </div>

      <div class="meal-right">
        <h3>${meal.strMeal || ''}</h3>

        <div class="meal-meta">
          <div><strong>CATEGORY:</strong> ${meal.strCategory || '—'}</div>
          <div style="margin-top:10px;"><strong>Source:</strong>
            ${ sourceUrl ? `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="source-link">${shortSource}</a>` : `<span class="muted">No source</span>`}
          </div>
          <div style="margin-top:10px;"><strong>Tags:</strong>
            ${ tags.length ? tags.map(t => `<span class="tag">${t}</span>`).join(" ") : `<span class="muted">none</span>` }
          </div>
        </div>

        <div class="ingredients">
          <div style="font-weight:700;">Ingredients</div>
          ${ingredients.map(i => `<div class="ing"><span class="ing-num">${i.key}</span> ${i.ing}</div>`).join("")}

        </div>
      </div>

      <div class="full-width-box">
      
        <div class="measure-box">
          <div style="font-weight:700; margin-bottom:10px;">Measure:</div>
          <div class="measure-grid">
            ${ingredients.map(i => `
              <div class="measure-item">
                <span class="measure-key"><i class="fa-solid fa-key"></i></span>
                <div class="measure-text">${i.measure || '—'} <span class="measure-dot"></span> ${i.ing}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions">
          <div style="font-weight:700; margin-bottom:10px;">Instructions:</div>
          <ul>
            ${String(meal.strInstructions || "").split(/\r?\n/).filter(Boolean).map(step => `<li><span class="tick"><i class="fa-solid fa-check"></i></span>${step}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Meal details error:", err);
  }
}


// INITIALIZER

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();

  if (document.getElementById("mealList")) loadMealsByCategory();
  if (document.getElementById("mealDetails")) loadMealDetails();
});