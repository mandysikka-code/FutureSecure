const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".panel"));
const waFab = document.getElementById("waFab");
const waWidget = document.getElementById("waWidget");
const waClose = document.getElementById("waClose");
const testimonialsTrack = document.querySelector(".testimonials-track");
const advisoryForm = document.getElementById("advisoryForm");
const formStatus = document.getElementById("formStatus");
const motionToggleButtons = Array.from(document.querySelectorAll(".motion-toggle"));
const GOOGLE_SHEETS_WEB_APP_URL = "https://docs.google.com/spreadsheets/d/1V-2eM9a7B4tc0BYJ9s9sstMQQnP1pgYC/edit?usp=drive_web&ouid=101175710241661931570&rtpof=true";

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetId = tab.dataset.target;
    if (!targetId) return;

    tabs.forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-selected", "false");
    });

    panels.forEach((panel) => panel.classList.remove("is-active"));
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");

    const targetPanel = document.getElementById(targetId);
    if (targetPanel) targetPanel.classList.add("is-active");
  });
});

function isValidAppsScriptEndpoint(url) {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(url);
}

function setStatus(statusElement, message, type) {
  if (!(statusElement instanceof HTMLElement)) return;
  statusElement.textContent = message;
  statusElement.classList.remove("is-success", "is-error");
  if (type === "success") statusElement.classList.add("is-success");
  if (type === "error") statusElement.classList.add("is-error");
}

function getAttributionData() {
  const query = new URLSearchParams(window.location.search);
  return {
    utmSource: query.get("utm_source") || "direct",
    utmMedium: query.get("utm_medium") || "none",
    utmCampaign: query.get("utm_campaign") || "none",
    utmTerm: query.get("utm_term") || "none",
    utmContent: query.get("utm_content") || "none",
    landingPage: window.location.href
  };
}

function pushEvent(eventName, payload) {
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...payload });
  }
  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, payload);
  }
}

async function submitLead(payload) {
  if (!isValidAppsScriptEndpoint(GOOGLE_SHEETS_WEB_APP_URL)) {
    throw new Error("Google Sheets endpoint is not configured yet. Please use your deployed Apps Script Web App URL ending with /exec.");
  }

  const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Google Sheets request failed with status ${response.status}.`);
  }
}

function setWhatsAppWidgetState(isOpen) {
  if (!(waWidget instanceof HTMLElement) || !(waFab instanceof HTMLElement)) return;
  waWidget.classList.toggle("open", isOpen);
  waWidget.setAttribute("aria-hidden", isOpen ? "false" : "true");
  waFab.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

if (waFab && waWidget) {
  waFab.addEventListener("click", () => {
    const nextOpenState = !waWidget.classList.contains("open");
    setWhatsAppWidgetState(nextOpenState);
    pushEvent("chat_widget_toggle", { state: nextOpenState ? "open" : "closed" });
  });
}

if (waClose && waWidget) {
  waClose.addEventListener("click", () => {
    setWhatsAppWidgetState(false);
    pushEvent("chat_widget_toggle", { state: "closed" });
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && waWidget instanceof HTMLElement && waWidget.classList.contains("open")) {
    setWhatsAppWidgetState(false);
    if (waFab instanceof HTMLElement) waFab.focus();
    pushEvent("chat_widget_toggle", { state: "closed" });
  }
});

let chatMotionRaf = null;
function updateChatbotScrollShift() {
  const shift = Math.min(window.scrollY * 0.08, 26);
  document.documentElement.style.setProperty("--chatbot-scroll-shift", `${shift}px`);
  chatMotionRaf = null;
}

window.addEventListener(
  "scroll",
  () => {
    if (chatMotionRaf !== null) return;
    chatMotionRaf = window.requestAnimationFrame(updateChatbotScrollShift);
  },
  { passive: true }
);

function ensureTestimonialsLoopTrack() {
  if (!(testimonialsTrack instanceof HTMLElement)) return;
  const primaryGroup = testimonialsTrack.querySelector(".testimonials-group");
  if (!(primaryGroup instanceof HTMLElement)) return;
  const existingClone = testimonialsTrack.querySelector('.testimonials-group[data-clone="true"]');
  if (existingClone) return;

  const clone = primaryGroup.cloneNode(true);
  if (clone instanceof HTMLElement) {
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("data-clone", "true");
    const cloneAvatars = clone.querySelectorAll(".testimonial-avatar");
    cloneAvatars.forEach((img) => img.setAttribute("alt", ""));
    testimonialsTrack.appendChild(clone);
  }
}

async function loadIndianTestimonialAvatars() {
  const testimonialAvatars = Array.from(document.querySelectorAll(".testimonials-group .testimonial-avatar"));
  if (!testimonialAvatars.length) return;

  try {
    const response = await fetch("https://randomuser.me/api/?results=18&nat=in&seed=future-secure-india");
    if (!response.ok) throw new Error(`Failed to load testimonial avatars: ${response.status}`);
    const data = await response.json();
    const portraits = (data.results || []).map((item) => item.picture && item.picture.large).filter(Boolean);
    if (!portraits.length) throw new Error("No Indian profile portraits returned from avatar service.");
    testimonialAvatars.forEach((avatar, index) => {
      avatar.src = portraits[index % portraits.length];
    });
  } catch (error) {
    console.error(error);
  }
}

function bindTrackedClicks() {
  const trackedElements = document.querySelectorAll("[data-track], a[href*='wa.me'], a[href^='tel:'], a[href^='mailto:']");
  trackedElements.forEach((element) => {
    element.addEventListener("click", () => {
      const trackName = element.getAttribute("data-track") || "engagement_click";
      const target = element.getAttribute("href") || "";
      pushEvent("cta_click", { trackName, target });
    });
  });
}

function setupFormAccessibility(form) {
  const fields = Array.from(form.querySelectorAll("input, select, textarea"));
  fields.forEach((field) => {
    if (field.required) {
      field.setAttribute("aria-required", "true");
    }
    field.addEventListener("invalid", () => {
      field.setAttribute("aria-invalid", "true");
    });
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true" && field.checkValidity()) {
        field.removeAttribute("aria-invalid");
      }
    });
    field.addEventListener("change", () => {
      if (field.getAttribute("aria-invalid") === "true" && field.checkValidity()) {
        field.removeAttribute("aria-invalid");
      }
    });
  });
}

function validateBeforeSubmit(form, statusElement) {
  if (form.checkValidity()) return true;
  const firstInvalid = form.querySelector(":invalid");
  if (firstInvalid instanceof HTMLElement) {
    firstInvalid.focus();
  }
  form.reportValidity();
  setStatus(statusElement, "Please fill all required fields correctly before submitting.", "error");
  return false;
}

function bindMotionControls() {
  motionToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selector = button.getAttribute("data-motion-target");
      if (!selector) return;
      const track = document.querySelector(selector);
      if (!(track instanceof HTMLElement)) return;
      const isPaused = track.classList.toggle("paused");
      button.setAttribute("aria-pressed", isPaused ? "true" : "false");
      button.textContent = isPaused ? "Resume Auto-scroll" : "Pause Auto-scroll";
    });
  });
}

if (advisoryForm instanceof HTMLFormElement) {
  setupFormAccessibility(advisoryForm);
  advisoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateBeforeSubmit(advisoryForm, formStatus)) return;
    const submitButton = advisoryForm.querySelector('button[type="submit"]');
    if (!(submitButton instanceof HTMLButtonElement)) {
      throw new Error("Submit button not found in advisory form.");
    }

    const formData = new FormData(advisoryForm);
    const payload = {
      leadType: "consultation",
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      profession: String(formData.get("profession") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      goal: String(formData.get("goal") || "").trim(),
      source: "Website - Future Secure",
      submittedAt: new Date().toISOString(),
      ...getAttributionData()
    };

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    setStatus(formStatus, "Saving your lead details securely...", null);

    try {
      await submitLead(payload);
      advisoryForm.reset();
      setStatus(formStatus, "Thanks! Your request has been submitted successfully. Our advisor will contact you soon.", "success");
      pushEvent("lead_submit", { leadType: "consultation", goal: payload.goal });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit your request to Google Sheets.";
      setStatus(formStatus, message, "error");
      pushEvent("lead_submit_failed", { leadType: "consultation" });
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Request Consultation";
    }
  });
}

updateChatbotScrollShift();
ensureTestimonialsLoopTrack();
bindTrackedClicks();
bindMotionControls();
loadIndianTestimonialAvatars();
setWhatsAppWidgetState(false);

const footerYear = document.getElementById("footerYear");
if (footerYear) {
  footerYear.textContent = String(new Date().getFullYear());
}
