// --- Global State ---
let currentEmail = "";
let currentDomain = "@tempmailx.site";
let inboxData = [];
let autoIncomingInterval;
let emailIdCounter = 1;

// --- DOM Elements ---
const elEmailDisplay = document.getElementById("emailDisplay");
const elDomainSelect = document.getElementById("domainSelect");
const elCopyBtn = document.getElementById("copyBtn");
const elGenerateNewBtn = document.getElementById("generateNewBtn");
const elRefreshBtn = document.getElementById("refreshBtn");
const elDeleteBtn = document.getElementById("deleteBtn");

const elInboxCount = document.getElementById("inboxCount");
const elInboxList = document.getElementById("inboxList");
const elSearchInput = document.getElementById("searchInput");
const elInboxLoader = document.getElementById("inboxLoader");

const elEmailViewer = document.getElementById("emailViewer");
const elEmptyViewer = document.getElementById("emptyViewer");
const elViewerContent = document.getElementById("viewerContent");

const elVSender = document.getElementById("vSender");
const elVAvatar = document.getElementById("vAvatar");
const elVSenderEmail = document.getElementById("vSenderEmail");
const elVTime = document.getElementById("vTime");
const elVSubject = document.getElementById("vSubject");
const elVBody = document.getElementById("vBody");
const elVOtpContainer = document.getElementById("vOtpContainer");
const elVOtp = document.getElementById("vOtp");

const elToastContainer = document.getElementById("toastContainer");
const elCloseMobileBtn = document.getElementById("closeMobileBtn");
const elLiveClock = document.getElementById("liveClock");

// --- Demo Data Templates ---
const demoEmails = [
    { sender: "Instagram", subject: "Your verification code", body: "Someone tried to log in to your Instagram account. If this was you, use the following code to complete your sign in. This code will expire in 10 minutes.", otp: true },
    { sender: "Telegram", subject: "Telegram Login Code", body: "Here is your Telegram login code. Do not give this code to anyone, even if they say they are from Telegram! \n\nThis code can be used to log in to your Telegram account.", otp: true },
    { sender: "Discord", subject: "Discord Security Alert", body: "A new login location was detected. Please use the following authentication code to verify it's you.", otp: true },
    { sender: "Amazon", subject: "Amazon Authentication", body: "To authenticate your request, please use the OTP below. Don't share this with anyone.", otp: true },
    { sender: "Google", subject: "Google Sign-in code", body: "You are attempting to sign in on a new device. Use this verification code to securely log in.", otp: true },
    { sender: "Netflix", subject: "Complete your signup", body: "Welcome to Netflix! We're thrilled to have you. Click the link in this email or enter the code below on your TV to start watching.", otp: true },
    { sender: "Spotify", subject: "Password Reset Request", body: "We received a request to reset your Spotify password. Use this code to authorize the change.", otp: true },
    { sender: "System", subject: "Welcome to TempMailX", body: "Your temporary inbox is ready! You can now use this email address to sign up for services without exposing your real email. Auto-refresh is enabled.", otp: false }
];

// --- Initialization ---
function init() {
    updateClock();
    setInterval(updateClock, 1000);
    
    generateTempEmail();
    setupEventListeners();
    
    // Add welcome email
    addDemoEmail(demoEmails[7]);
    
    // Start auto-demo simulation (every 15 seconds)
    autoIncomingInterval = setInterval(simulateIncomingEmail, 15000);
}

// --- Functions ---

function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateTempEmail() {
    const prefixes = ["user", "alpha", "test", "demo", "box", "mail"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const randomStr = generateRandomString(4);
    
    currentEmail = `${randomPrefix}${randomNumber}${randomStr}${currentDomain}`;
    elEmailDisplay.value = currentEmail;
    
    // Clear inbox on new generation (except if initial load)
    if (inboxData.length > 1) {
        clearInbox();
    }
    showToast("New temporary email generated", "info", "fa-wand-magic-sparkles");
}

function clearInbox() {
    inboxData = [];
    renderInbox();
    closeEmail();
}

function updateClock() {
    const now = new Date();
    elLiveClock.textContent = now.toLocaleTimeString();
}

function copyToClipboard() {
    elEmailDisplay.select();
    elEmailDisplay.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(elEmailDisplay.value);
    showToast("Email copied successfully!", "success", "fa-check-circle");
}

function showToast(message, type = "info", icon = "fa-info-circle") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    elToastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = "fadeOut 0.3s ease forwards";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function simulateIncomingEmail() {
    // Pick random template (excluding the welcome message at index 7)
    const template = demoEmails[Math.floor(Math.random() * 7)];
    addDemoEmail(template);
    showToast(`New email from ${template.sender}`, "success", "fa-envelope");
}

function addDemoEmail(template) {
    const now = new Date();
    let timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let generatedOtp = null;
    if (template.otp) {
        generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const newEmail = {
        id: emailIdCounter++,
        sender: template.sender,
        senderEmail: `noreply@${template.sender.toLowerCase()}.com`,
        subject: template.subject,
        body: template.body,
        time: timeString,
        otp: generatedOtp,
        unread: true
    };

    inboxData.unshift(newEmail); // Add to top
    renderInbox();
}

function renderInbox(searchTerm = "") {
    elInboxCount.textContent = inboxData.length;
    elInboxList.innerHTML = "";

    const filteredData = inboxData.filter(email => 
        email.sender.toLowerCase().includes(searchTerm.toLowerCase()) || 
        email.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredData.length === 0) {
        elInboxList.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <p>${searchTerm ? 'No emails found matching search.' : 'No emails received yet.'}</p>
            </div>
        `;
        return;
    }

    filteredData.forEach(email => {
        const item = document.createElement("div");
        item.className = `email-item ${email.unread ? 'unread' : ''}`;
        item.onclick = () => openEmail(email.id, item);
        
        item.innerHTML = `
            <div class="ei-top">
                <span class="ei-sender">${email.sender}</span>
                <span class="ei-time">${email.time}</span>
            </div>
            <div class="ei-subject">${email.subject}</div>
        `;
        elInboxList.appendChild(item);
    });
}

function openEmail(id, element) {
    const email = inboxData.find(e => e.id === id);
    if (!email) return;

    // Mark read
    email.unread = false;
    renderInbox(elSearchInput.value); // Re-render to clear unread badge

    // Populate viewer
    elVAvatar.textContent = email.sender.charAt(0).toUpperCase();
    elVSender.textContent = email.sender;
    elVSenderEmail.textContent = `<${email.senderEmail}>`;
    elVTime.textContent = email.time;
    elVSubject.textContent = email.subject;
    elVBody.textContent = email.body;

    if (email.otp) {
        elVOtpContainer.style.display = "block";
        elVOtp.textContent = email.otp;
    } else {
        elVOtpContainer.style.display = "none";
    }

    // Toggle UI States
    elEmptyViewer.style.display = "none";
    elViewerContent.style.display = "flex";

    // Mobile specific logic
    if (window.innerWidth <= 900) {
        elEmailViewer.classList.add("mobile-active");
        document.querySelector(".inbox-panel").classList.add("mobile-hidden");
    }
}

function closeEmail() {
    elEmptyViewer.style.display = "flex";
    elViewerContent.style.display = "none";
    
    // Mobile specific logic
    elEmailViewer.classList.remove("mobile-active");
    document.querySelector(".inbox-panel").classList.remove("mobile-hidden");
}

function refreshInbox() {
    elInboxLoader.classList.add("active");
    
    // Simulate network delay
    setTimeout(() => {
        elInboxLoader.classList.remove("active");
        simulateIncomingEmail();
    }, 1500);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    elDomainSelect.addEventListener("change", (e) => {
        currentDomain = e.target.value;
        const currentPrefix = currentEmail.split("@")[0];
        currentEmail = `${currentPrefix}${currentDomain}`;
        elEmailDisplay.value = currentEmail;
        showToast(`Domain switched to ${currentDomain}`, "info", "fa-globe");
    });

    elCopyBtn.addEventListener("click", copyToClipboard);
    
    elGenerateNewBtn.addEventListener("click", generateTempEmail);
    
    elRefreshBtn.addEventListener("click", refreshInbox);
    
    elDeleteBtn.addEventListener("click", () => {
        clearInbox();
        showToast("Email address and inbox deleted", "success", "fa-trash");
        // Optionally generate a new one right after deleting
        setTimeout(generateTempEmail, 500);
    });

    elSearchInput.addEventListener("input", (e) => {
        renderInbox(e.target.value);
    });

    elCloseMobileBtn.addEventListener("click", closeEmail);
}

// Start App
window.addEventListener("DOMContentLoaded", init);
