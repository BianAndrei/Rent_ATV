// Two auto-scrolling gallery rows moving in opposite directions at the same time.
const IMAGES = ["image00001.jpeg", "image00002.jpeg", "image00003.jpeg", "image00004.jpeg", "image00009.jpeg", "image00011.jpeg", "image00013.jpeg", "image00015.jpeg", "image00019.jpeg", "image00020.jpeg", "image00021.jpeg", "image00022.jpeg", "image00026.jpeg", "image00027.jpeg", "image00028.jpeg", "image00029.jpeg", "image00031.jpeg", "image00038.jpeg", "image00040.jpeg", "image00041.jpeg", "image00042.jpeg"];

document.querySelectorAll(".marquee").forEach((row, rowIndex) => {
  const track = row.querySelector(".track");
  const set = IMAGES.map((n, i) => ({ n, i })).filter(({ i }) => i % 2 === rowIndex);
  // Duplicate once so the -50% loop is seamless
  [...set, ...set].forEach(({ n }, k) => {
    const card = document.createElement("figure");
    card.className = "tile";
    const img = new Image();
    img.src = `assets/images/${n}`;
    img.alt = "ATV ride";
    img.decoding = "async";
    card.append(img);
    if (k >= set.length) card.setAttribute("aria-hidden", "true");
    track.appendChild(card);
  });
});

const dialog = document.getElementById("book-dialog");
document.getElementById("book-btn").addEventListener("click", () => dialog.showModal());
document.getElementById("book-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

// mailto: does nothing on desktops without a mail app, so open Gmail compose there instead
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
if (!isMobile) {
  document.querySelectorAll("[data-email]").forEach((a) => {
    const url = new URL(a.href);
    a.href = "https://mail.google.com/mail/?view=cm&to=" + encodeURIComponent(url.pathname) +
      "&su=" + encodeURIComponent(url.searchParams.get("subject") || "ATV booking");
    a.target = "_blank";
    a.rel = "noopener";
  });
}

const callToggle = document.getElementById("call-toggle");
const callOptions = document.getElementById("call-options");
const setCall = (open) => {
  callOptions.classList.toggle("open", open);
  callToggle.setAttribute("aria-expanded", String(open));
};
callToggle.addEventListener("click", () => setCall(!callOptions.classList.contains("open")));

// Animated close for the booking sheet
const closeSheet = () => {
  if (!dialog.open || dialog.classList.contains("closing")) return;
  dialog.classList.add("closing");
  dialog.addEventListener("animationend", () => {
    dialog.classList.remove("closing");
    dialog.close();
    setCall(false);
  }, { once: true });
};
document.getElementById("book-close").onclick = closeSheet;
dialog.onclick = (e) => { if (e.target === dialog) closeSheet(); };
dialog.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(); });

// Top-right CONTACT: scroll to the contact section, then pull out the booking sheet
document.querySelector(".book-link").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => { if (!dialog.open) dialog.showModal(); }, 900);
});
