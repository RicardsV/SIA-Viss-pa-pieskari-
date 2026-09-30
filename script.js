// ---- Sample data (later this will come from your backend/database) ----
const services = ["Oil change", "Brake inspection", "Tyre change", "Full diagnostics", "Annual service"];

const mechanics = [
  { id: "m1", name: "Jānis" },
  { id: "m2", name: "Andris" },
  { id: "m3", name: "Līga" }
];

const timeSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

const history = [
  { date: "2026-03-12", work: "Oil and filter change", mechanic: "Jānis", km: 84200 },
  { date: "2025-10-02", work: "Winter tyres fitted", mechanic: "Andris", km: 79850 },
  { date: "2025-05-20", work: "Front brake pads replaced", mechanic: "Līga", km: 74100 }
];

const demoUsers = [
  { email: "admin@autocare.com", password: "123456", name: "Anna Smith" },
  { email: "customer@demo.com", password: "demo123", name: "Martin Jones" }
];

// ---- State ----
let bookings = loadBookings();
let selectedTime = null;

// ---- Elements ----
const form = document.getElementById("booking-form");
const loginForm = document.getElementById("login-form");
const loginModal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userBadge = document.getElementById("user-badge");
const loginStatus = document.getElementById("login-status");
const bookingMessage = document.getElementById("booking-message");
const serviceEl = document.getElementById("service");
const mechanicEl = document.getElementById("mechanic");
const dateEl = document.getElementById("date");
const slotsEl = document.getElementById("slots");
const errorEl = document.getElementById("error");
const loginErrorEl = document.getElementById("login-error");

// ---- Storage (browser only, for the demo) ----
function loadBookings() {
  try {
    return JSON.parse(localStorage.getItem("bookings")) || [];
  } catch {
    return [];
  }
}

function saveBookings() {
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser"));
  } catch {
    return null;
  }
}

function saveCurrentUser(user) {
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
  }
}

function showLoginModal() {
  loginModal.classList.remove("hidden");
  loginModal.setAttribute("aria-hidden", "false");
}

function hideLoginModal() {
  loginModal.classList.add("hidden");
  loginModal.setAttribute("aria-hidden", "true");
  loginForm.reset();
  loginErrorEl.textContent = "";
}

function setBookingAccess(enabled) {
  const fields = [
    document.getElementById("name"),
    document.getElementById("plate"),
    serviceEl,
    mechanicEl,
    dateEl
  ];

  fields.forEach(field => {
    field.disabled = !enabled;
  });

  form.querySelector("button[type='submit']").disabled = !enabled;
  if (!enabled) {
    slotsEl.innerHTML = "Log in to select a time.";
  }
}

function updateAuthUI() {
  const currentUser = getCurrentUser();
  const isLoggedIn = Boolean(currentUser);

  userBadge.textContent = isLoggedIn ? currentUser.name : "Guest";
  userBadge.classList.toggle("hidden", !isLoggedIn);
  loginBtn.classList.toggle("hidden", isLoggedIn);
  logoutBtn.classList.toggle("hidden", !isLoggedIn);

  loginStatus.textContent = isLoggedIn ? "Logged in" : "Login required";
  loginStatus.classList.toggle("logged-in", isLoggedIn);

  bookingMessage.textContent = isLoggedIn
    ? `Welcome back, ${currentUser.name}. Your saved appointments are below.`
    : "Log in to view your appointments.";

  setBookingAccess(isLoggedIn);
}

function ensureAuthForBooking() {
  if (!getCurrentUser()) {
    showLoginModal();
    return false;
  }
  return true;
}

// ---- Setup ----
serviceEl.innerHTML = services.map(s => `<option>${s}</option>`).join("");
mechanicEl.innerHTML =
  `<option value="">Choose a mechanic</option>` +
  mechanics.map(m => `<option value="${m.id}">${m.name}</option>`).join("");

const today = new Date().toISOString().split("T")[0];
dateEl.min = today;

// ---- Time slots ----
function renderSlots() {
  selectedTime = null;
  if (!mechanicEl.value || !dateEl.value) {
    slotsEl.textContent = "Choose a mechanic and date to see times.";
    return;
  }
  const taken = bookings
    .filter(b => b.mechanicId === mechanicEl.value && b.date === dateEl.value)
    .map(b => b.time);

  slotsEl.innerHTML = "";
  timeSlots.forEach(time => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot";
    btn.textContent = time;
    btn.setAttribute("aria-pressed", "false");
    btn.disabled = taken.includes(time);
    btn.addEventListener("click", () => {
      selectedTime = time;
      slotsEl.querySelectorAll(".slot").forEach(s => s.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
    });
    slotsEl.appendChild(btn);
  });
}

mechanicEl.addEventListener("change", renderSlots);
dateEl.addEventListener("change", renderSlots);

loginBtn.addEventListener("click", showLoginModal);
logoutBtn.addEventListener("click", () => {
  saveCurrentUser(null);
  updateAuthUI();
  renderBookings();
});

document.querySelectorAll("[data-close='true']").forEach(element => {
  element.addEventListener("click", hideLoginModal);
});

loginForm.addEventListener("submit", e => {
  e.preventDefault();
  loginErrorEl.textContent = "";

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value.trim();

  const user = demoUsers.find(entry => entry.email === email && entry.password === password);

  if (!user) {
    loginErrorEl.textContent = "Incorrect email or password.";
    return;
  }

  saveCurrentUser({ email: user.email, name: user.name });
  hideLoginModal();
  updateAuthUI();
  renderBookings();
});

// ---- Submit ----
form.addEventListener("submit", e => {
  e.preventDefault();
  errorEl.textContent = "";

  if (!ensureAuthForBooking()) {
    return;
  }

  const currentUser = getCurrentUser();
  const name = document.getElementById("name").value.trim();
  const plate = document.getElementById("plate").value.trim().toUpperCase();

  if (!name || !plate || !mechanicEl.value || !dateEl.value || !selectedTime) {
    errorEl.textContent = "Fill in every field and pick a time.";
    return;
  }

  bookings.push({
    userEmail: currentUser.email,
    name,
    plate,
    service: serviceEl.value,
    mechanicId: mechanicEl.value,
    date: dateEl.value,
    time: selectedTime
  });

  saveBookings();
  form.reset();
  renderSlots();
  renderBookings();
  document.getElementById("bookings-section").scrollIntoView({ behavior: "smooth" });
});

// ---- Lists ----
function mechanicName(id) {
  return mechanics.find(m => m.id === id)?.name ?? "";
}

function renderBookings() {
  const list = document.getElementById("bookings");
  const currentUser = getCurrentUser();

  if (!currentUser) {
    list.innerHTML = `<li class="empty">No appointments yet. Please sign in to see your bookings.</li>`;
    return;
  }

  const userBookings = bookings.filter(booking => booking.userEmail === currentUser.email);
  if (userBookings.length === 0) {
    list.innerHTML = `<li class="empty">No appointments yet. Use the form above to book one.</li>`;
    return;
  }

  const sorted = [...userBookings].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  list.innerHTML = sorted.map(b => `
    <li>
      <span><strong>${b.service}</strong> for ${b.plate}<br>
        <span class="meta">with ${mechanicName(b.mechanicId)}</span></span>
      <span>${b.date} at ${b.time}</span>
    </li>`).join("");
}

function renderHistory() {
  document.getElementById("history-list").innerHTML = history.map(h => `
    <li>
      <span><strong>${h.work}</strong><br>
        <span class="meta">by ${h.mechanic} · ${h.km.toLocaleString()} km</span></span>
      <span>${h.date}</span>
    </li>`).join("");
}

updateAuthUI();
renderBookings();
renderHistory();
