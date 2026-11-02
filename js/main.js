// Two auto-scrolling gallery rows moving in opposite directions at the same time.
const IMAGES = ["image00001.jpeg", "image00002.jpeg", "image00003.jpeg", "image00004.jpeg", "image00009.jpeg", "image00011.jpeg", "image00013.jpeg", "image00015.jpeg", "image00019.jpeg", "image00020.jpeg", "image00021.jpeg", "image00022.jpeg", "image00026.jpeg", "image00027.jpeg", "image00028.jpeg", "image00029.jpeg", "image00031.jpeg", "image00038.jpeg", "image00040.jpeg", "image00041.jpeg", "image00042.jpeg", "trail-statue.jpeg", "trail-field.jpeg"];

document.querySelectorAll(".marquee").forEach((row, rowIndex) => {
  const track = row.querySelector(".track");
  const set = IMAGES.map((n, i) => ({ n, i })).filter(({ i }) => i % 2 === rowIndex);
  // Duplicate once so the -50% loop is seamless
  [...set, ...set].forEach(({ n }, k) => {
    const card = document.createElement("figure");
    card.className = "tile";
    const img = new Image();
    img.src = `assets/images/${n}`;
    img.alt = "Tură cu ATV-ul";
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
      "&su=" + encodeURIComponent(url.searchParams.get("subject") || "Rezervare ATV");
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

// Price receipt: the total follows the ride time, riders and ATVs picked on it.
// Up to 2 riders per ATV; everyone past the first on an ATV pays the passenger rate.
const receipt = document.getElementById("receipt");
const maxAtvs = Number(receipt.dataset.maxAtvs);
const crew = { riders: 1, atvs: 1 };
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const money = (n) => `${n.toLocaleString("ro-RO")} ${receipt.dataset.currency}`;
const setLine = (id, label, amount) => {
  const [name, , price] = document.getElementById(id).children;
  name.textContent = label;
  price.textContent = money(amount);
};

const renderReceipt = () => {
  const time = receipt.querySelector("input[name=time]:checked");
  const passengers = crew.riders - crew.atvs;
  const atvCost = crew.atvs * Number(time.dataset.atv);
  const passengerCost = passengers * Number(time.dataset.passenger);

  setLine("rc-atv-line", `ATV × ${crew.atvs} · ${time.nextElementSibling.textContent}`, atvCost);
  setLine("rc-pass-line", `Pasager × ${passengers}`, passengerCost);
  document.getElementById("rc-pass-line").hidden = passengers === 0;

  receipt.querySelectorAll(".stepper").forEach((stepper) => {
    const value = crew[stepper.dataset.field];
    const max = stepper.dataset.field === "riders" ? maxAtvs * 2 : maxAtvs;
    stepper.querySelector("output").value = value;
    stepper.querySelector("[data-step='-1']").disabled = value <= 1;
    stepper.querySelector("[data-step='1']").disabled = value >= max;
  });

  document.getElementById("rc-note").textContent = passengers > 0
    ? `${passengers} ${passengers === 1 ? "pasager" : "pasageri"} în spate · max 2 pe ATV`
    : crew.riders === 1 ? "Tură solo, 1 persoană pe 1 ATV" : "Fiecare conduce propriul ATV";

  rollTotal(atvCost + passengerCost);
};

// Total rolls like an odometer: one 0-9 strip per digit, starting from 0 the first time it scrolls into view
const total = document.getElementById("rc-total");
let totalAmount = 0;
let totalSeen = false;
const rollTotal = (amount) => {
  totalAmount = amount;
  const text = money(amount);
  const chars = [...amount.toLocaleString("ro-RO")];
  if (total.dataset.shape !== chars.join("").replace(/\d/g, "0")) {
    total.dataset.shape = chars.join("").replace(/\d/g, "0");
    total.replaceChildren(...chars.map((c) => {
      const col = document.createElement("span");
      if (!/\d/.test(c)) { col.textContent = c; col.ariaHidden = "true"; return col; }
      col.className = "roll";
      col.ariaHidden = "true";
      const strip = document.createElement("span");
      for (let d = 0; d <= 9; d++) strip.append(Object.assign(document.createElement("span"), { textContent: d }));
      col.append(strip);
      return col;
    }), Object.assign(document.createElement("span"), { textContent: ` ${receipt.dataset.currency}`, ariaHidden: "true" }),
    Object.assign(document.createElement("span"), { className: "sr-only" }));
    void total.offsetWidth; // let new strips sit at 0 before rolling
  }
  total.lastElementChild.textContent = text;
  if (!totalSeen) return;
  const strips = total.querySelectorAll(".roll > span");
  const digits = chars.filter((c) => /\d/.test(c));
  strips.forEach((strip, i) => {
    strip.style.transitionDelay = `${i * 90}ms`;
    strip.style.transform = `translateY(${-digits[i] * 10}%)`;
  });
};
new IntersectionObserver(([entry], obs) => {
  if (!entry.isIntersecting) return;
  totalSeen = true;
  obs.disconnect();
  rollTotal(totalAmount);
}, { threshold: 0.6 }).observe(total);

receipt.querySelectorAll(".stepper button").forEach((btn) => btn.addEventListener("click", () => {
  const step = Number(btn.dataset.step);
  if (btn.closest(".stepper").dataset.field === "riders") {
    crew.riders = clamp(crew.riders + step, 1, maxAtvs * 2);
    crew.atvs = clamp(crew.atvs, Math.ceil(crew.riders / 2), crew.riders);
  } else {
    crew.atvs = clamp(crew.atvs + step, 1, maxAtvs);
    crew.riders = clamp(crew.riders, crew.atvs, crew.atvs * 2);
  }
  renderReceipt();
}));
receipt.addEventListener("change", renderReceipt);
receipt.addEventListener("submit", (e) => e.preventDefault());

const rcDate = document.getElementById("rc-date");
rcDate.dateTime = new Date().toISOString().slice(0, 10);
rcDate.textContent = new Date().toLocaleDateString("ro-RO");

document.getElementById("rc-book").addEventListener("click", (e) => {
  e.preventDefault();
  if (!dialog.open) dialog.showModal();
});
renderReceipt();
