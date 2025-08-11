// DOM Elements
const passwordInput = document.getElementById("passwordInput");
const togglePassword = document.getElementById("togglePassword");
const strengthText = document.getElementById("strengthText");
const strengthBar = document.getElementById("strengthBar");
const suggestions = document.getElementById("suggestions");
const suggestionsList = document.getElementById("suggestionsList");
const errorMessage = document.getElementById("errorMessage");
const container = document.querySelector(".container");
const themeToggle = document.getElementById("themeToggle");

// Configuration
const API_CONFIG = {
  LOCAL_URL: "http://127.0.0.1:5000",
  PRODUCTION_URL: "https://your-app.onrender.com",
  USE_PRODUCTION: false,
};

const API_URL = API_CONFIG.USE_PRODUCTION
  ? API_CONFIG.PRODUCTION_URL
  : API_CONFIG.LOCAL_URL;

// Common weak passwords database
const COMMON_PASSWORDS = new Set([
  "password",
  "123456",
  "123456789",
  "qwerty",
  "abc123",
  "monkey",
  "password123",
  "admin",
  "letmein",
  "welcome",
  "123123",
  "password1",
  "iloveyou",
  "princess",
  "rockyou",
  "1234567890",
  "superman",
  "qwertyuiop",
  "azerty",
  "trustno1",
  "000000",
  "shadow",
  "michael",
  "jennifer",
  "master",
  "111111",
  "dragon",
  "sunshine",
  "football",
  "jesus",
  "hello",
  "charlie",
  "aa123456",
  "donald",
  "qwerty123",
]);

/*
  Toggle dark/light mode
 */
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.toggle("dark-mode");

  // Update icon
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  themeToggle.title = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";

  // Save preference
  localStorage.setItem("darkMode", isDark);
}

/*
  Initialize theme based on saved preference
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem("darkMode");
  const prefersDark =
    savedTheme === "true" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (prefersDark) {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
    themeToggle.title = "Switch to Light Mode";
  } else {
    themeToggle.textContent = "🌙";
    themeToggle.title = "Switch to Dark Mode";
  }
}

/*
  Toggle password visibility
 */
function togglePasswordVisibility() {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  togglePassword.textContent = type === "password" ? "👁️" : "🙈";
}

/*
  Debounce function to limit API calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/*
 Client-side password strength evaluation (fallback/preview mode)
 */
function evaluatePasswordStrengthOffline(password) {
  if (!password) {
    return {
      strength: "Enter a password to check its strength",
      score: 0,
      suggestions: [
        "Use a mix of uppercase and lowercase letters",
        "Include numbers and special characters",
        "Make it at least 12 characters long",
        "Avoid common passwords and dictionary words",
      ],
    };
  }

  let score = 0;
  let suggestions = [];

  // Length scoring
  const length = password.length;
  if (length >= 12) {
    score += 2;
  } else if (length >= 8) {
    score += 1;
  } else {
    suggestions.push("Use at least 8 characters (12+ recommended)");
  }

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (hasLowercase) score += 1;
  else suggestions.push("Include lowercase letters (a-z)");

  if (hasUppercase) score += 1;
  else suggestions.push("Include uppercase letters (A-Z)");

  if (hasDigits) score += 1;
  else suggestions.push("Include numbers (0-9)");

  if (hasSpecial) score += 1;
  else suggestions.push("Include special characters (!@#$%^&*)");

  // Check for common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = Math.max(0, score - 2);
    suggestions.push("Avoid common passwords");
  }

  // Sequential characters penalty
  if (
    /(012|123|234|345|456|567|678|789|890)/.test(password) ||
    /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/.test(
      password.toLowerCase()
    )
  ) {
    score = Math.max(0, score - 1);
    suggestions.push("Avoid sequential characters or numbers");
  }

  // Repeated characters penalty
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push("Avoid repeating characters");
  }

  // Dictionary words penalty
  const commonWords = [
    "password",
    "admin",
    "user",
    "login",
    "welcome",
    "hello",
    "world",
  ];
  for (const word of commonWords) {
    if (password.toLowerCase().includes(word)) {
      score = Math.max(0, score - 1);
      suggestions.push("Avoid dictionary words");
      break;
    }
  }

  // Determine strength level
  let strength;
  if (score >= 6) strength = "Very Strong";
  else if (score >= 5) strength = "Strong";
  else if (score >= 3) strength = "Medium";
  else if (score >= 1) strength = "Weak";
  else strength = "Very Weak";

  // Add positive feedback for strong passwords
  if (score >= 5 && suggestions.length === 0) {
    suggestions = ["🎉 Excellent! Your password is very strong."];
  } else if (score >= 3 && suggestions.length <= 1) {
    suggestions.push(
      "👍 Good password! Consider the suggestions above to make it even stronger."
    );
  }

  return { strength, score, suggestions };
}

/**
 * Check password strength via API or offline fallback
 */
async function checkPasswordStrength(password) {
  if (!password.trim()) {
    resetToDefault();
    return;
  }

  // Show loading state
  showLoadingState();

  try {
    // In this preview, we use offline evaluation
    // In production, this would call the Flask API
    const result = evaluatePasswordStrengthOffline(password);
    updateStrengthDisplay(result);
  } catch (error) {
    console.warn("Using offline evaluation:", error.message);
    const result = evaluatePasswordStrengthOffline(password);
    updateStrengthDisplay(result);
  }
}

/**
 * Show loading state while checking password
 */
function showLoadingState() {
  strengthText.textContent = "Analyzing...";
  strengthText.className = "strength-text loading";
  container.className = "container";
  hideError();
}

/**
 * Update the UI with strength evaluation results
 */
function updateStrengthDisplay(data) {
  const strengthClass = data.strength.toLowerCase().replace(" ", "-");

  strengthText.textContent = data.strength;
  strengthText.className = `strength-text ${strengthClass}`;
  container.className = `container ${strengthClass}`;

  if (data.suggestions && data.suggestions.length > 0) {
    updateSuggestionsList(data.suggestions);
    const title =
      data.score >= 5 ? "Great!" : data.score === 0 ? "Tips" : "Suggestions";
    suggestions.querySelector("h3").textContent = title;
  }

  hideError();
}

/**
 * Update the suggestions list
 */
function updateSuggestionsList(suggestionsList) {
  const ul = document.getElementById("suggestionsList");
  ul.innerHTML = "";

  suggestionsList.forEach((suggestion) => {
    const li = document.createElement("li");
    li.textContent = suggestion;
    ul.appendChild(li);
  });
}

/**
 * Reset UI to default state
 */
function resetToDefault() {
  strengthText.textContent = "Enter a password to check its strength";
  strengthText.className = "strength-text";
  container.className = "container";

  suggestions.querySelector("h3").textContent = "Tips";
  const defaultSuggestions = [
    "Use a mix of uppercase and lowercase letters",
    "Include numbers and special characters",
    "Make it at least 12 characters long",
    "Avoid common passwords and dictionary words",
  ];
  updateSuggestionsList(defaultSuggestions);

  hideError();
}

/**
 * Hide error message
 */
function hideError() {
  if (errorMessage) {
    errorMessage.style.display = "none";
  }
}

/**
 * Set a demo password (used by demo buttons)
 */
function setPassword(password) {
  passwordInput.value = password;
  passwordInput.focus();
  checkPasswordStrength(password);
}

/**
 * Initialize the application
 */
function initializeApp() {
  const debouncedCheck = debounce(checkPasswordStrength, 300);

  // Initialize theme
  initializeTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  if (togglePassword) {
    togglePassword.addEventListener("click", togglePasswordVisibility);
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      debouncedCheck(this.value);
    });
    passwordInput.focus();
  }

  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "/") {
      event.preventDefault();
      if (passwordInput) {
        passwordInput.focus();
        passwordInput.select();
      }
    }
  });

  console.log(
    "Password Strength Checker initialized with Dark/Light Mode Toggle"
  );
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// Make setPassword available globally for demo buttons
window.setPassword = setPassword;
