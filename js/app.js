const search = document.getElementById("productSearch");
const sort = document.getElementById("sortSelect");
const buttons = document.querySelectorAll(".category");
const grid = document.getElementById("productGrid");
const noResults = document.getElementById("noResults");
const results = document.getElementById("resultsCount");
const theme = document.getElementById("themeToggle");
const menuButton = document.getElementById("menuButton");
const mobileMenu = document.getElementById("mobileMenu");
const recentSection = document.getElementById("recentSection");
const recentList = document.getElementById("recentList");
const trendingList = document.getElementById("trendingList");
const compareDrawer = document.getElementById("compareDrawer");
const compareItems = document.getElementById("compareItems");
const comparisonTable = document.getElementById("comparisonTable");
const toast = document.getElementById("toast");
const back = document.getElementById("backToTop");
const cookie = document.getElementById("cookieNotice");

let cards = [];
let selected = "home";
let searchTimer;

function read(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function analyticsAllowed() {
  return localStorage.getItem("liveeverywhere-analytics-consent") === "accepted";
}

function track(name, params = {}) {
  if (analyticsAllowed() && typeof gtag === "function") gtag("event", name, params);
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("visible"), 2300);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createProductCard(product) {
  const categories = Array.isArray(product.categories) ? product.categories.join(" ") : "";
  const tags = Array.isArray(product.tags) ? product.tags.join(" ") : "";
  const badgeClass = product.badgeStyle === "orange" ? "badge orange" : "badge";
  return `
<article class="card" data-id="${escapeHtml(product.id)}" data-category="${escapeHtml(categories)}" data-category-label="${escapeHtml(product.categoryLabel)}" data-name="${escapeHtml(product.name)}" data-description="${escapeHtml(product.description)}" data-tags="${escapeHtml(tags)}"data-published-at="${escapeHtml(product.publishedAt || "")}"data-homepage="${product.homepage === true ? "true" : "false"}"
data-homepage-order="${Number(product.homepageOrder) || 999}" data-image="${escapeHtml(product.image)}" data-order="${Number(product.order) || 0}" data-favourite="false">
  <div class="image-wrap">
    <div class="card-actions">
      <button class="icon fav" type="button" title="Add to favourites">♥</button>
      <button class="icon compare" type="button" title="Add to comparison">⇄</button>
      <button class="icon share-icon" type="button" title="Share product">↗</button>
    </div>
    <span class="${badgeClass}">${escapeHtml(product.badge || "")}</span>
    <img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
  </div>
  <div class="content">
    <div class="product-category">${escapeHtml(product.categoryLabel)}</div>
    <h3 class="title">${escapeHtml(product.name)}</h3>
    <div class="rating"><span>✓ Handpicked Find</span></div>
    <p class="description">${escapeHtml(product.description)}</p>
    <div class="button-row">
      <a class="amazon" href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="noopener sponsored" data-product="${escapeHtml(product.name)}">View on Amazon</a>
      <button class="share" type="button">Share</button>
    </div>
  </div>
</article>`;
}

async function loadProducts() {
  results.textContent = "Loading products...";
  try {
    const response = await fetch("products.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load products: ${response.status}`);
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error("Product data must be an array.");
    grid.insertAdjacentHTML("afterbegin", products.map(createProductCard).join(""));
    cards = [...grid.querySelectorAll(".card")];
    initialiseProductFeatures();
    renderTrending();
    renderRecent();
    renderCompare();
    apply();
  } catch (error) {
    console.error("Product loading error:", error);
    results.textContent = "Products could not be loaded";
    noResults.style.display = "block";
    noResults.innerHTML = "<strong>Products could not be loaded.</strong><br>Please refresh the page and try again.";
  }
}

function cardById(id) { return cards.find(card => card.dataset.id === id); }
function counts() { return read("liveeverywhere-click-counts", {}); }

function renderTrending() {
  const clickCounts = counts();
  const ranked = [...cards].sort((a, b) => (clickCounts[b.dataset.id] || 0) - (clickCounts[a.dataset.id] || 0)).slice(0, 3);
  trendingList.innerHTML = "";
  ranked.forEach(card => {
    const button = document.createElement("button");
    const clicks = clickCounts[card.dataset.id] || 0;
    button.className = "chip";
    button.textContent = clicks > 0 ? `${card.dataset.name} (${clicks})` : card.dataset.name;
    button.onclick = () => card.scrollIntoView({ behavior: "smooth", block: "center" });
    trendingList.appendChild(button);
  });
}

function saveRecent(card) {
  let items = read("liveeverywhere-recent", []).filter(item => item.id !== card.dataset.id);
  items.unshift({ id: card.dataset.id, name: card.dataset.name });
  localStorage.setItem("liveeverywhere-recent", JSON.stringify(items.slice(0, 5)));
  renderRecent();
}

function renderRecent() {
  const items = read("liveeverywhere-recent", []);
  recentList.innerHTML = "";
  recentSection.classList.toggle("visible", items.length > 0);
  items.forEach(item => {
    const button = document.createElement("button");
    button.className = "chip";
    button.textContent = item.name;
    button.onclick = () => cardById(item.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    recentList.appendChild(button);
  });
}

function sortCards() {
  const option = sort.value;
  const clickCounts = counts();
  const sortedCards = [...cards];
  if (option === "name-asc") sortedCards.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
  if (option === "name-desc") sortedCards.sort((a, b) => b.dataset.name.localeCompare(a.dataset.name));
  if (option === "category") sortedCards.sort((a, b) => a.dataset.categoryLabel.localeCompare(b.dataset.categoryLabel));
  if (option === "popular") sortedCards.sort((a, b) => (clickCounts[b.dataset.id] || 0) - (clickCounts[a.dataset.id] || 0));
  if (option === "default") {
  sortedCards.sort((a, b) => {
    if (selected === "home") {
      return Number(a.dataset.homepageOrder) - Number(b.dataset.homepageOrder);
    }

    const dateA = a.dataset.publishedAt
      ? new Date(a.dataset.publishedAt).getTime()
      : 0;

    const dateB = b.dataset.publishedAt
      ? new Date(b.dataset.publishedAt).getTime()
      : 0;

    if (dateA !== dateB) return dateB - dateA;

    return Number(a.dataset.order) - Number(b.dataset.order);
  });
}
  sortedCards.forEach(card => grid.insertBefore(card, noResults));
}

function filter() {
  const term = search.value.toLowerCase().trim();
  let visible = 0;

  cards.forEach(card => {
    const searchable = `${card.dataset.name} ${card.dataset.description} ${card.dataset.categoryLabel} ${card.dataset.tags || ""}`.toLowerCase();

    const matchesSearch = searchable.includes(term);

    const matchesCategory =
      selected === "all" ||
      card.dataset.category.split(" ").includes(selected) ||
      (selected === "favourites" && card.dataset.favourite === "true");

    const isHomepageProduct = card.dataset.homepage === "true";

    const show =
      matchesSearch &&
      matchesCategory &&
      (selected !== "home" || isHomepageProduct);

    card.style.display = show ? "block" : "none";

    if (show) visible += 1;
  });

  noResults.style.display = visible ? "none" : "block";
  results.textContent = `✨ ${visible} Handpicked Find${visible === 1 ? "" : "s"}`;
}

function apply() {
  sortCards();
  filter();

  const trendingPanel = document.querySelector(".panel.trending");
  if (trendingPanel) {
  const hasSearch = search.value.trim() !== "";
  const hideForCategory =
    selected !== "all" && selected !== "home";

  trendingPanel.style.display =
    hasSearch || hideForCategory ? "none" : "";
}
}
function compareIds() { return read("liveeverywhere-compare", []); }

function renderCompare() {
  const ids = compareIds();
  compareItems.innerHTML = "";
  compareDrawer.classList.toggle("visible", ids.length > 0);
  ids.forEach(id => {
    const card = cardById(id);
    if (!card) return;
    const chip = document.createElement("span");
    chip.className = "compare-chip";
    chip.textContent = card.dataset.name;
    compareItems.appendChild(chip);
  });
  document.querySelectorAll(".compare").forEach(button => {
    const card = button.closest(".card");
    button.classList.toggle("active", ids.includes(card.dataset.id));
  });
}

async function shareProduct(card) {
  const url = card.querySelector(".amazon").href;
  const data = { title: `${card.dataset.name} | LiveEveryWhere`, text: `Take a look at ${card.dataset.name}.`, url };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(url); notify("Product link copied"); }
    track("product_shared", { product_name: card.dataset.name });
  } catch (error) {
    if (error.name !== "AbortError") notify("Unable to share product");
  }
}

function initialiseProductFeatures() {
  const savedFavourites = read("liveeverywhere-favourites", []);
  document.querySelectorAll(".fav").forEach(button => {
    const card = button.closest(".card");
    const id = card.dataset.id;
    if (savedFavourites.includes(id)) { button.classList.add("active"); card.dataset.favourite = "true"; }
    button.onclick = () => {
      button.classList.toggle("active");
      const active = button.classList.contains("active");
      card.dataset.favourite = String(active);
      let list = read("liveeverywhere-favourites", []);
      list = active ? [...new Set([...list, id])] : list.filter(item => item !== id);
      localStorage.setItem("liveeverywhere-favourites", JSON.stringify(list));
      notify(active ? "Added to favourites" : "Removed from favourites");
      track("favourite_changed", { product_name: card.dataset.name, favourite_status: active ? "added" : "removed" });
      filter();
    };
  });

  document.querySelectorAll(".compare").forEach(button => {
    button.onclick = () => {
      const card = button.closest(".card");
      const id = card.dataset.id;
      let ids = compareIds();
      if (ids.includes(id)) { ids = ids.filter(item => item !== id); notify("Removed from comparison"); }
      else {
        if (ids.length >= 3) { notify("Compare up to 3 products"); return; }
        ids.push(id); notify("Added to comparison");
      }
      localStorage.setItem("liveeverywhere-compare", JSON.stringify(ids));
      renderCompare();
      track("compare_selection_changed", { product_name: card.dataset.name, selected_count: ids.length });
    };
  });

  document.querySelectorAll(".image-wrap").forEach(wrapper => {
    wrapper.onclick = event => {
      if (event.target.closest(".icon")) return;
      const card = wrapper.closest(".card");
      const zoomImage = document.getElementById("zoomImage");
      zoomImage.src = card.dataset.image;
      zoomImage.alt = card.dataset.name;
      document.getElementById("zoomTitle").textContent = card.dataset.name;
      openModal("zoomModal");
      track("product_image_zoom", { product_name: card.dataset.name });
    };
  });

  document.querySelectorAll(".share-icon, .share").forEach(button => {
    button.onclick = () => { const card = button.closest(".card"); saveRecent(card); shareProduct(card); };
  });

  document.querySelectorAll(".card .amazon").forEach(button => {
    button.onclick = () => {
      const card = button.closest(".card");
      const clickCounts = counts();
      clickCounts[card.dataset.id] = (clickCounts[card.dataset.id] || 0) + 1;
      localStorage.setItem("liveeverywhere-click-counts", JSON.stringify(clickCounts));
      saveRecent(card);
      renderTrending();
      track("amazon_click", { product_name: button.dataset.product, product_category: card.dataset.categoryLabel, link_location: "product_card" });
    };
  });
}

function openModal(id) { document.getElementById(id).classList.add("open"); document.body.classList.add("lock"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); document.body.classList.remove("lock"); }

search.oninput = () => {
  apply();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (search.value.trim()) track("product_search", { search_term: search.value.trim() });
  }, 700);
};

sort.onchange = () => { apply(); track("product_sort", { sort_option: sort.value }); };
buttons.forEach(button => {
  button.onclick = () => {
    buttons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    selected = button.dataset.category;
    apply();
    track("category_selected", { category_name: selected });
  };
});
const interestButtons = document.querySelectorAll(".interest-chip");

interestButtons.forEach(button => {
  button.onclick = () => {
    interestButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    search.value = button.dataset.interest;
    selected = "all";

    buttons.forEach(item => item.classList.remove("active"));
    document.querySelector('[data-category="all"]').classList.add("active");

    apply();

    track("interest_selected", {
      interest_name: button.dataset.interest
    });
  };
});

document.getElementById("clearFilters").onclick = () => {
  search.value = "";
  sort.value = "default";
  selected = "all";
  buttons.forEach(button => button.classList.remove("active"));
  document.querySelector('[data-category="all"]').classList.add("active");
  interestButtons.forEach(button => button.classList.remove("active"));
  apply();
};

document.getElementById("clearComparison").onclick = () => {
  localStorage.removeItem("liveeverywhere-compare");
  renderCompare();
};

document.getElementById("openComparison").onclick = () => {
  const chosen = compareIds().map(cardById).filter(Boolean);
  if (chosen.length < 2) { notify("Select at least 2 products"); return; }
  comparisonTable.innerHTML = `
<thead><tr><th>Feature</th>${chosen.map(card => `<th>${escapeHtml(card.dataset.name)}</th>`).join("")}</tr></thead>
<tbody>
<tr><th>Image</th>${chosen.map(card => `<td><img class="comparison-thumb" src="${escapeHtml(card.dataset.image)}" alt="${escapeHtml(card.dataset.name)}"></td>`).join("")}</tr>
<tr><th>Category</th>${chosen.map(card => `<td>${escapeHtml(card.dataset.categoryLabel)}</td>`).join("")}</tr>
<tr><th>Description</th>${chosen.map(card => `<td>${escapeHtml(card.dataset.description)}</td>`).join("")}</tr>
<tr><th>Amazon</th>${chosen.map(card => `<td><a class="amazon" href="${escapeHtml(card.querySelector(".amazon").href)}" target="_blank" rel="noopener sponsored">View on Amazon</a></td>`).join("")}</tr>
</tbody>`;
  openModal("comparisonModal");
  track("comparison_opened", { compared_products: chosen.length });
};

document.querySelectorAll("[data-close]").forEach(button => button.onclick = () => closeModal(button.dataset.close));
document.querySelectorAll(".modal").forEach(modal => modal.onclick = event => { if (event.target === modal) closeModal(modal.id); });
document.onkeydown = event => { if (event.key === "Escape") document.querySelectorAll(".modal.open").forEach(modal => closeModal(modal.id)); };
document.getElementById("clearRecent").onclick = () => { localStorage.removeItem("liveeverywhere-recent"); renderRecent(); };

if (localStorage.getItem("liveeverywhere-theme") === "dark") { document.body.classList.add("dark"); theme.textContent = "☀️"; }
theme.onclick = () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  theme.textContent = dark ? "☀️" : "🌙";
  localStorage.setItem("liveeverywhere-theme", dark ? "dark" : "light");
};

menuButton.onclick = () => {
  const open = mobileMenu.classList.toggle("open");
  menuButton.textContent = open ? "✕" : "☰";
};
mobileMenu.querySelectorAll("a").forEach(link => link.onclick = () => { mobileMenu.classList.remove("open"); menuButton.textContent = "☰"; });
window.onscroll = () => back.classList.toggle("visible", window.scrollY > 650);
back.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

const consent = localStorage.getItem("liveeverywhere-analytics-consent");

if (consent === "accepted" || consent === "declined") {
    cookie.style.display = "none";
} else {
    cookie.style.display = "block";
}
document.getElementById("acceptAnalytics").onclick = () => {
  localStorage.setItem("liveeverywhere-analytics-consent", "accepted");
  gtag("consent", "update", { analytics_storage: "granted" });
  cookie.style.display = "none";
  notify("Analytics accepted");
};
document.getElementById("declineAnalytics").onclick = () => {
  localStorage.setItem("liveeverywhere-analytics-consent", "declined");
  gtag("consent", "update", { analytics_storage: "denied" });
  cookie.style.display = "none";
  notify("Analytics declined");
};

document.getElementById("currentYear").textContent = new Date().getFullYear();
loadProducts();