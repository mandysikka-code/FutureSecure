const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".panel"));
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
    if (targetPanel) {
      targetPanel.classList.add("is-active");
    }
  });
});

const waFab = document.getElementById("waFab");
const waWidget = document.getElementById("waWidget");
const waClose = document.getElementById("waClose");

if (waFab && waWidget) {
  waFab.addEventListener("click", () => {
    waWidget.classList.toggle("open");
  });
}

if (waClose && waWidget) {
  waClose.addEventListener("click", () => {
    waWidget.classList.remove("open");
  });
}

let chatMotionRaf = null;
function updateChatbotScrollShift() {
  const shift = Math.min(window.scrollY * 0.08, 26);
  document.documentElement.style.setProperty("--chatbot-scroll-shift", `${shift}px`);
  chatMotionRaf = null;
}

window.addEventListener("scroll", () => {
  if (chatMotionRaf !== null) return;
  chatMotionRaf = window.requestAnimationFrame(updateChatbotScrollShift);
}, { passive: true });

updateChatbotScrollShift();

const advisoryForm = document.getElementById("advisoryForm");
const formStatus = document.getElementById("formStatus");

function isValidAppsScriptEndpoint(url) {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(url);
}

function setFormStatus(message, type) {
  if (!(formStatus instanceof HTMLElement)) return;
  formStatus.textContent = message;
  formStatus.classList.remove("is-success", "is-error");
  if (type === "success") formStatus.classList.add("is-success");
  if (type === "error") formStatus.classList.add("is-error");
}

if (advisoryForm instanceof HTMLFormElement) {
  advisoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = advisoryForm.querySelector('button[type="submit"]');
    if (!(submitButton instanceof HTMLButtonElement)) {
      throw new Error("Submit button not found in advisory form.");
    }

    const formData = new FormData(advisoryForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const profession = String(formData.get("profession") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const goal = String(formData.get("goal") || "").trim();

    if (!isValidAppsScriptEndpoint(GOOGLE_SHEETS_WEB_APP_URL)) {
      setFormStatus("Google Sheets endpoint is not configured yet. Please use your deployed Apps Script Web App URL ending with /exec.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    setFormStatus("Saving your lead details securely...", null);

    try {
      const payload = {
        name,
        phone,
        email,
        profession,
        location,
        goal,
        source: "Website - Future Secure",
        submittedAt: new Date().toISOString()
      };

      const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Google Sheets request failed with status ${response.status}.`);
      }

      advisoryForm.reset();
      setFormStatus("Thanks! Your request has been submitted successfully. Our advisor will contact you soon.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit your request to Google Sheets.";
      setFormStatus(message, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Request Consultation";
    }
  });
}
