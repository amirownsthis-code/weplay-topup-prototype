/**
 * WePlay Web Recharge & Store - Interactive Scripts
 * Handles dynamic JSON data loading, region selector popup (with Pakistan),
 * infinite advertiser carousel, page tab switching, coin package selection,
 * gift box countdown under icon, payment selection, and modal checkout.
 */

// Fallback data in case the site is opened directly via file:// protocol
const DEFAULT_DATA = {
  packages: {
    goldCoins: [
      {
        id: "coins-3000",
        coins: "3000 gold coins",
        icon: "assets/images/single-coin.png",
        description: "Obtain \"Q Version Levi Gift Card\" x1, up to 810 gold coins.",
        price: 4.99,
        currency: "$",
        badge: null,
        selected: true
      },
      {
        id: "coins-10000",
        coins: "10,000 gold coins",
        icon: "assets/images/medium-coins.png",
        description: "Obtain \"Q Version Mikasa Gift Card\" x1, up to 2800 coins.",
        price: 12.99,
        currency: "$",
        badge: null,
        selected: false
      },
      {
        id: "coins-50000",
        coins: "50,000 gold coins",
        icon: "assets/images/more-coins.png",
        description: "Obtain \"Q Version Allen Gift Card\" x1, up to 15,000 gold coins.",
        price: 59.99,
        currency: "$",
        badge: "×1",
        selected: false
      },
      {
        id: "coins-100000",
        coins: "100,000 gold coins",
        icon: "assets/images/coins-tresure.png",
        description: "Obtain 2 \"Q Version Allen Gift Cards\" and you can get up to 30,000 gold coins.",
        price: 120,
        currency: "$",
        badge: "×2",
        selected: false
      },
      {
        id: "coins-250000",
        coins: "250,000 gold coins",
        icon: "assets/images/coins-tresure.png",
        description: "Obtain 5 \"Q Version Allen Gift Cards\" and you can get up to 75,000 gold coins.",
        price: 300,
        currency: "$",
        badge: "×5",
        selected: false
      },
      {
        id: "coins-500000",
        coins: "500,000 gold coins",
        icon: "assets/images/coins-tresure.png",
        description: "Obtain 10 \"Q Version Allen Gift Cards\" and you can get up to 150,000 gold coins.",
        price: 600,
        currency: "$",
        badge: "×10",
        selected: false
      },
      {
        id: "coins-1000000",
        coins: "1 million gold coins",
        icon: "assets/images/coins-tresure.png",
        description: "Obtain 20 \"Q Version Allen Gift Cards\" and you can get up to 300,000 gold coins.",
        price: 1200,
        currency: "$",
        badge: "×20",
        selected: false
      }
    ]
  },
  payments: {
    title: "Stored Value Pipeline",
    methods: [
      { id: "visa", name: "VISA", icon: "assets/images/visa-card.png", selected: true },
      { id: "mastercard", name: "mastercard", icon: "assets/images/mastercard.png", selected: false },
      { id: "apple-pay", name: "Apple Pay", icon: "assets/images/apple-card.png", selected: false },
      { id: "google-pay", name: "Google Pay", icon: "assets/images/google pay.png", selected: false }
    ]
  },
  regions: {
    selected: "USA",
    list: ["USA", "Canada", "Pakistan", "India", "China"]
  },
  site: {
    user: { name: "Wu Chen", id: "wuchen" },
    banners: [
      { id: "bar-1", image: "assets/images/bar-1.png", alt: "Special Offer 1" },
      { id: "bar-2", image: "assets/images/bar-2.webp", alt: "Special Offer 2" }
    ],
    giftPack: { hours: 95, minutes: 22, seconds: 46 }
  }
};

/**
 * Currency conversion rates (relative to 1 USD)
 */
const CURRENCY_CONFIG = {
  USA:      { symbol: "$",  code: "USD", rate: 1 },
  Canada:   { symbol: "C$", code: "CAD", rate: 1.36 },
  Pakistan: { symbol: "Rs", code: "PKR", rate: 278.50 },
  India:    { symbol: "₹",  code: "INR", rate: 83.50 },
  China:    { symbol: "¥",  code: "CNY", rate: 7.25 }
};

// Application State
let appData = { ...DEFAULT_DATA };
let selectedPackage = DEFAULT_DATA.packages.goldCoins[0];
let selectedPayment = DEFAULT_DATA.payments.methods[0];
let selectedRegion = "USA";
let currentCurrency = CURRENCY_CONFIG.USA;
let userEmail = "";
let countdownTotalSeconds = 95 * 3600 + 22 * 60 + 46;

document.addEventListener("DOMContentLoaded", async () => {
  await loadAllData();
  renderGoldCoinPackages();
  renderPaymentMethods();
  setupRegionDropdown();
  setupAdvertiserCarousel();
  setupNavigationTabs();
  setupBillMailbox();
  setupPaymentGateway();
  setupMemberPage();
  setupRedEnvelopePage();
  setupGameCard1Page();
  setupGameCard2Page();
  setupCountdownTimer();
  setupLoginFlow();
  setupIdHelpModal();
  convertAllPrices();
});

/**
 * Loads JSON data asynchronously from files
 */
async function loadAllData() {
  try {
    const [packRes, payRes, regRes, siteRes] = await Promise.all([
      fetch("data/packages.json"),
      fetch("data/payment-methods.json"),
      fetch("data/regions.json"),
      fetch("data/site-data.json")
    ]);
    
    if (packRes.ok && payRes.ok && siteRes.ok) {
      const packagesData = await packRes.json();
      const paymentsData = await payRes.json();
      const siteData = await siteRes.json();

      appData.packages = packagesData;
      appData.payments = paymentsData;
      appData.site = siteData;
      
      const defaultSelected = packagesData.goldCoins.find(p => p.selected) || packagesData.goldCoins[0];
      selectedPackage = defaultSelected;
      
      const defaultPay = paymentsData.methods.find(m => m.selected) || paymentsData.methods[0];
      selectedPayment = defaultPay;

      if (siteData.giftPack) {
        countdownTotalSeconds = siteData.giftPack.hours * 3600 + siteData.giftPack.minutes * 60 + siteData.giftPack.seconds;
      }
    }

    if (regRes && regRes.ok) {
      const regData = await regRes.json();
      appData.regions = {
        selected: regData.selected || "Macao",
        list: regData.regions.map(r => r.name)
      };
      selectedRegion = appData.regions.selected;
    }
  } catch (err) {
    console.info("Using embedded JSON defaults:", err);
  }
}

/**
 * Setup Region Dropdown Popup with currency conversion
 */
function setupRegionDropdown() {
  const btn = document.getElementById("regionBtn");
  const dropdown = document.getElementById("regionDropdown");
  const regionText = document.getElementById("selectedRegionText");

  if (!btn || !dropdown) return;

  // Toggle dropdown on button click
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  // Handle region option selection
  const options = dropdown.querySelectorAll(".region-option");
  options.forEach(opt => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const newRegion = opt.dataset.region;
      selectedRegion = newRegion;
      currentCurrency = CURRENCY_CONFIG[newRegion] || CURRENCY_CONFIG.USA;
      
      if (regionText) regionText.textContent = opt.textContent;
      
      options.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");

      dropdown.classList.remove("open");

      // Re-render all prices in the new currency
      convertAllPrices();
      showToast(`Region updated to ${newRegion} (${currentCurrency.code})`);
    });
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });
}

/**
 * Converts a USD base price to the current region's currency
 */
function convertPrice(usdPrice) {
  const converted = usdPrice * currentCurrency.rate;
  // For large rates (PKR, INR), round to whole number; otherwise 2 decimals
  if (currentCurrency.rate >= 10) {
    return Math.round(converted);
  }
  return parseFloat(converted.toFixed(2));
}

/**
 * Formats a converted price with the current currency symbol
 */
function formatPrice(usdPrice) {
  return `${currentCurrency.symbol}${convertPrice(usdPrice).toLocaleString()}`;
}

/**
 * Re-renders all prices across every tab in the selected currency
 */
function convertAllPrices() {
  // 1. Gold Coins tab — re-render cards & update summary
  renderGoldCoinPackages();

  // 2. Member tab — update member card prices + summary
  const memberCards = document.querySelectorAll("#memberPlansGrid .member-card");
  memberCards.forEach(card => {
    const basePrice = parseFloat(card.dataset.price); // USD base
    const priceEl = card.querySelector(".member-card-price");
    if (priceEl) {
      priceEl.innerHTML = `<sub>${currentCurrency.symbol}</sub>${convertPrice(basePrice).toLocaleString()}`;
    }
  });
  const memberSummary = document.getElementById("memberSummaryPriceVal");
  if (memberSummary) {
    const selectedMember = document.querySelector("#memberPlansGrid .member-card.selected");
    const baseP = selectedMember ? parseFloat(selectedMember.dataset.price) : 7.99;
    memberSummary.textContent = formatPrice(baseP);
  }

  // 3. Red Envelope tab — update package prices + summary
  const redEnvPackages = document.querySelectorAll("#redEnvPackagesList .package-item");
  redEnvPackages.forEach(pkg => {
    const basePrice = parseFloat(pkg.dataset.price);
    const priceEl = pkg.querySelector(".pkg-price");
    if (priceEl) priceEl.textContent = formatPrice(basePrice);
  });
  const redEnvSummary = document.getElementById("redEnvSummaryPriceVal");
  if (redEnvSummary) {
    const selectedRed = document.querySelector("#redEnvPackagesList .package-item.selected");
    const baseP = selectedRed ? parseFloat(selectedRed.dataset.price) : 4.99;
    const qty = document.querySelector("#redEnvQtyGrid .qty-btn.active");
    const qtyNum = qty ? parseInt(qty.dataset.qty) : 1;
    redEnvSummary.textContent = formatPrice(baseP * qtyNum);
  }

  // 4. Game Card tab 1 — update card prices + summary
  const gameCards1 = document.querySelectorAll("#gameCard1Grid .game-card-box");
  gameCards1.forEach(card => {
    const basePrice = parseFloat(card.dataset.price);
    const priceEl = card.querySelector(".game-card-body div");
    if (priceEl) priceEl.textContent = formatPrice(basePrice);
  });
  const gc1Summary = document.getElementById("gameCard1SummaryPriceVal");
  if (gc1Summary) {
    const selectedGC1 = document.querySelector("#gameCard1Grid .game-card-box.selected");
    const baseP = selectedGC1 ? parseFloat(selectedGC1.dataset.price) : 7.99;
    gc1Summary.textContent = formatPrice(baseP);
  }

  // 5. Game Card tab 2 (if exists)
  const gameCards2 = document.querySelectorAll("#gameCard2Grid .game-card-box");
  gameCards2.forEach(card => {
    const basePrice = parseFloat(card.dataset.price);
    const priceEl = card.querySelector(".game-card-body div");
    if (priceEl) priceEl.textContent = formatPrice(basePrice);
  });
  const gc2Summary = document.getElementById("gameCard2SummaryPriceVal");
  if (gc2Summary) {
    const selectedGC2 = document.querySelector("#gameCard2Grid .game-card-box.selected");
    const baseP = selectedGC2 ? parseFloat(selectedGC2.dataset.price) : 11.99;
    gc2Summary.textContent = formatPrice(baseP);
  }
}

/**
 * Renders the 7 gold coin package cards in .right.card
 */
function renderGoldCoinPackages() {
  const container = document.getElementById("goldCoinsList");
  if (!container) return;

  container.innerHTML = "";

  appData.packages.goldCoins.forEach((item) => {
    const isSelected = item.id === selectedPackage.id;
    const card = document.createElement("div");
    card.className = `package-item ${isSelected ? "selected" : ""}`;
    card.dataset.id = item.id;

    // Megaphone badge overlay
    let badgeHtml = "";
    if (item.badge) {
      badgeHtml = `
        <div class="icon-badge">
          <span class="badge-icon">📢</span>
          <span>${item.badge}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="package-icon-wrap">
        <img src="${item.icon}" alt="${item.coins}">
        ${badgeHtml}
      </div>
      <div class="package-info">
        <h3 class="package-title">${item.coins}</h3>
        <p class="package-desc">${item.description}</p>
      </div>
      <div class="package-price">${formatPrice(item.price)}</div>
    `;

    card.addEventListener("click", () => {
      selectPackage(item);
    });

    container.appendChild(card);
  });

  updatePriceDisplay();
}

/**
 * Handles package selection and updates price
 */
function selectPackage(pkg) {
  selectedPackage = pkg;
  
  const allCards = document.querySelectorAll(".package-item");
  allCards.forEach(card => {
    if (card.dataset.id === pkg.id) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  updatePriceDisplay();
}

/**
 * Updates the summary price at the bottom
 */
function updatePriceDisplay() {
  const priceDisplay = document.getElementById("summaryPriceVal");
  if (priceDisplay && selectedPackage) {
    priceDisplay.textContent = formatPrice(selectedPackage.price);
  }
}

/**
 * Renders Stored Value Pipeline payment methods
 */
function renderPaymentMethods() {
  const gridIds = ["paymentGrid", "memberPaymentGrid", "redEnvPaymentGrid", "gameCard1PaymentGrid", "gameCard2PaymentGrid"];
  const containers = gridIds.map(id => document.getElementById(id)).filter(Boolean);
  if (containers.length === 0) return;

  const displayMethods = appData.payments.methods.filter(m => !m.regionSpecific).slice(0, 4);

  containers.forEach(container => {
    container.innerHTML = "";
    displayMethods.forEach((method) => {
      const isSelected = method.id === selectedPayment.id;
      const card = document.createElement("div");
      card.className = `payment-card ${isSelected ? "selected" : ""}`;
      card.dataset.id = method.id;

      card.innerHTML = `
        <img src="${method.icon}" alt="${method.name}">
        <span class="payment-name">${method.name}</span>
      `;

      card.addEventListener("click", () => {
        selectPaymentMethod(method);
      });

      container.appendChild(card);
    });
  });
}

/**
 * Handles payment method selection
 */
function selectPaymentMethod(method) {
  selectedPayment = method;

  const allCards = document.querySelectorAll(".payment-card");
  allCards.forEach(card => {
    if (card.dataset.id === method.id) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

/**
 * Handles Membership page interactions (card selection, bill input, checkout)
 */
function setupMemberPage() {
  const grid = document.getElementById("memberPlansGrid");
  const summaryVal = document.getElementById("memberSummaryPriceVal");
  const nextBtn = document.getElementById("memberNextStepBtn");
  const billTrigger = document.getElementById("memberBillBtn");
  const billInputBox = document.getElementById("memberBillInputBox");
  const emailInput = document.getElementById("memberEmailInput");
  const saveBtn = document.getElementById("memberEmailSaveBtn");
  const savedDisplay = document.getElementById("memberSavedEmailDisplay");
  const savedText = document.getElementById("memberSavedEmailText");
  const editBtn = document.getElementById("memberEditEmailBtn");

  if (!grid) return;

  const cards = grid.querySelectorAll(".member-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      const price = card.dataset.price;
      const name = card.dataset.name;
      if (summaryVal) summaryVal.textContent = formatPrice(parseFloat(price));

      selectedPackage = {
        coins: name,
        price: parseFloat(price),
        currency: currentCurrency.symbol
      };
    });
  });

  if (billTrigger && billInputBox) {
    billTrigger.addEventListener("click", () => {
      billTrigger.style.display = "none";
      billInputBox.classList.add("open");
      emailInput.focus();
    });

    function saveMemberEmail() {
      const val = emailInput.value.trim();
      if (val && val.includes("@") && val.includes(".")) {
        userEmail = val;
        savedText.textContent = userEmail;
        billInputBox.classList.remove("open");
        savedDisplay.classList.add("active");
        showToast("Email saved! Lucky reward unlocked.");
      } else {
        showToast("Please enter a valid email address.");
        emailInput.focus();
      }
    }

    if (saveBtn) saveBtn.addEventListener("click", saveMemberEmail);
    if (emailInput) {
      emailInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveMemberEmail();
      });
    }
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        savedDisplay.classList.remove("active");
        billInputBox.classList.add("open");
        emailInput.focus();
      });
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const selectedCard = grid.querySelector(".member-card.selected");
      const name = selectedCard ? selectedCard.dataset.name : "1-month membership";
      const basePrice = selectedCard ? parseFloat(selectedCard.dataset.price) : 7.99;

      openPaymentGateway(name, formatPrice(basePrice));
    });
  }
}

/**
 * Advertiser Bar with seamless right-to-left infinite slider:
 * Banner 1 stays for 3.6s, smoothly slides left while Banner 2 comes in from right,
 * Banner 2 stays for 3.6s, and repeats smoothly.
 */
function setupAdvertiserCarousel() {
  const barContainer = document.getElementById("advertiserBar");
  const track = document.getElementById("bannerTrack");
  const dotsContainer = document.getElementById("bannerDots");
  
  if (!barContainer || !track) return;

  const originalSlides = Array.from(track.querySelectorAll(".banner-slide"));
  if (originalSlides.length <= 1) return;

  // Clone first slide to enable smooth infinite loop
  const cloneFirst = originalSlides[0].cloneNode(true);
  track.appendChild(cloneFirst);

  const totalSlidesCount = track.children.length; // 3 items: Slide0, Slide1, Slide0(clone)
  let currentIndex = 0;
  let isTransitioning = false;
  let bannerTimer = null;
  let isPaused = false;

  dotsContainer.innerHTML = "";
  originalSlides.forEach((_, idx) => {
    const dot = document.createElement("span");
    dot.className = `banner-dot ${idx === 0 ? "active" : ""}`;
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      goToSlide(idx);
    });
    dotsContainer.appendChild(dot);
  });

  function updateDots(activeIdx) {
    const dots = dotsContainer.querySelectorAll(".banner-dot");
    dots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === (activeIdx % originalSlides.length));
    });
  }

  function moveToNext() {
    if (isPaused || isTransitioning) return;
    isTransitioning = true;
    currentIndex++;

    track.style.transition = "transform 0.75s cubic-bezier(0.25, 1, 0.5, 1)";
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateDots(currentIndex);

    if (currentIndex === totalSlidesCount - 1) {
      setTimeout(() => {
        track.style.transition = "none";
        currentIndex = 0;
        track.style.transform = "translateX(0%)";
        isTransitioning = false;
      }, 760);
    } else {
      setTimeout(() => {
        isTransitioning = false;
      }, 760);
    }
  }

  function goToSlide(targetIdx) {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex = targetIdx;
    track.style.transition = "transform 0.75s cubic-bezier(0.25, 1, 0.5, 1)";
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateDots(currentIndex);
    setTimeout(() => {
      isTransitioning = false;
    }, 760);
    resetTimer();
  }

  function startTimer() {
    clearInterval(bannerTimer);
    bannerTimer = setInterval(moveToNext, 3600);
  }

  function resetTimer() {
    clearInterval(bannerTimer);
    startTimer();
  }

  barContainer.addEventListener("mouseenter", () => {
    isPaused = true;
  });

  barContainer.addEventListener("mouseleave", () => {
    isPaused = false;
  });

  startTimer();
}

/**
 * Setup navigation tabs for Left Card
 */
function setupNavigationTabs() {
  const navBtns = document.querySelectorAll(".nav-page-btn");
  const views = document.querySelectorAll(".page-view");

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      navBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      views.forEach(view => {
        if (view.id === `view-${targetTab}`) {
          view.classList.add("active");
        } else {
          view.classList.remove("active");
        }
      });

      const rightCard = document.getElementById("rightCard");
      if (rightCard) {
        rightCard.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

/**
 * Bill Mailbox interactive input and saving
 */
function setupBillMailbox() {
  const triggerBtn = document.getElementById("billPlaceholderBtn");
  const inputBox = document.getElementById("billInputBox");
  const emailInput = document.getElementById("emailInput");
  const saveBtn = document.getElementById("emailSaveBtn");
  const savedDisplay = document.getElementById("savedEmailDisplay");
  const savedText = document.getElementById("savedEmailText");
  const editBtn = document.getElementById("editEmailBtn");

  if (!triggerBtn || !inputBox) return;

  triggerBtn.addEventListener("click", () => {
    triggerBtn.style.display = "none";
    inputBox.classList.add("open");
    emailInput.focus();
  });

  function saveEmail() {
    const val = emailInput.value.trim();
    if (val && val.includes("@") && val.includes(".")) {
      userEmail = val;
      savedText.textContent = userEmail;
      inputBox.classList.remove("open");
      savedDisplay.classList.add("active");
      showToast(`Email saved! Lucky reward unlocked.`);
    } else {
      showToast("Please enter a valid email address.");
      emailInput.focus();
    }
  }

  saveBtn.addEventListener("click", saveEmail);
  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEmail();
  });

  editBtn.addEventListener("click", () => {
    savedDisplay.classList.remove("active");
    inputBox.classList.add("open");
    emailInput.focus();
  });
}

/**
 * Setup Payment Gateway Modal & Success Receipt (Reference Image 1)
 */
function openPaymentGateway(itemTitle, itemPrice) {
  const modal = document.getElementById("paymentModal");
  if (!modal) return;

  const itemTitleEl = document.getElementById("paySummaryItemTitle");
  const bigPriceEl = document.getElementById("paySummaryBigPrice");
  const userIdEl = document.getElementById("payDetailUserId");
  const userNameEl = document.getElementById("payDetailUserName");
  const emailEl = document.getElementById("payDetailEmail");
  const txIdEl = document.getElementById("payTxId");
  const langTextEl = document.getElementById("payLangRegionText");
  const submitBtnTextEl = document.getElementById("paySubmitBtnText");
  const methodTitleEl = document.getElementById("payMethodHeaderTitle");
  const methodIconEl = document.getElementById("payMethodHeaderIcon");
  const cardBox = document.getElementById("payCardBox");
  const walletBox = document.getElementById("payWalletBox");
  const walletIcon = document.getElementById("payWalletIcon");
  const walletTitle = document.getElementById("payWalletTitle");
  const walletBtnText = document.getElementById("payWalletBtnText");

  const checkoutView = document.getElementById("payViewCheckout");
  const receiptView = document.getElementById("payViewReceipt");

  // Reset to checkout form view
  if (checkoutView && receiptView) {
    checkoutView.style.display = "flex";
    receiptView.style.display = "none";
  }

  // Set Package & Price details
  const formattedTitle = itemTitle || (selectedPackage ? selectedPackage.coins : "3000 Gold Coins");
  const formattedPrice = itemPrice || (selectedPackage ? formatPrice(selectedPackage.price) : formatPrice(4.99));

  if (itemTitleEl) itemTitleEl.textContent = formattedTitle;
  if (bigPriceEl) bigPriceEl.textContent = formattedPrice;
  if (submitBtnTextEl) submitBtnTextEl.textContent = `Pay ${formattedPrice}`;

  // Set User details
  const activeUser = loggedInUser || appData.site.user || { name: "Wu Chen", id: "wuchen" };
  if (userIdEl) userIdEl.textContent = activeUser.id || "wuchen";
  if (userNameEl) userNameEl.textContent = activeUser.name || "Wu Chen";
  if (emailEl) emailEl.textContent = userEmail || "Not provided";

  // Dynamic Transaction ID
  const txNumber = "T" + new Date().toISOString().replace(/\D/g, "").slice(0, 14) + Math.floor(100000 + Math.random() * 900000);
  if (txIdEl) txIdEl.textContent = txNumber;

  if (langTextEl) {
    const reg = (selectedRegion || "Macao").toUpperCase().slice(0, 2);
    langTextEl.textContent = `${reg} ENGLISH`;
  }

  // Adjust Payment Method Interface based on selection
  const payId = selectedPayment ? selectedPayment.id : "visa";
  const payIcon = (selectedPayment && selectedPayment.icon) ? selectedPayment.icon : "assets/images/visa-card.png";
  
  if (payId === "apple-pay") {
    if (methodTitleEl) methodTitleEl.textContent = "Apple Pay";
    if (methodIconEl) {
      methodIconEl.innerHTML = `<img src="assets/images/apple-card.png" alt="Apple Pay" class="pay-header-card-img">`;
    }
    if (cardBox) cardBox.style.display = "none";
    if (walletBox) walletBox.style.display = "block";
    if (walletIcon) {
      walletIcon.innerHTML = `<img src="assets/images/apple-card.png" alt="Apple Pay" style="width:48px;height:auto;object-fit:contain;border-radius:8px;">`;
    }
    if (walletTitle) walletTitle.textContent = "Apple Pay";
    if (walletBtnText) walletBtnText.textContent = `Pay with Apple Pay (${formattedPrice})`;
  } else if (payId === "google-pay") {
    if (methodTitleEl) methodTitleEl.textContent = "Google Pay";
    if (methodIconEl) {
      methodIconEl.innerHTML = `<img src="assets/images/google pay.png" alt="Google Pay" class="pay-header-card-img">`;
    }
    if (cardBox) cardBox.style.display = "none";
    if (walletBox) walletBox.style.display = "block";
    if (walletIcon) {
      walletIcon.innerHTML = `<img src="assets/images/google pay.png" alt="Google Pay" style="width:48px;height:auto;object-fit:contain;border-radius:8px;">`;
    }
    if (walletTitle) walletTitle.textContent = "Google Pay";
    if (walletBtnText) walletBtnText.textContent = `Pay with Google Pay (${formattedPrice})`;
  } else if (payId === "mastercard") {
    if (methodTitleEl) methodTitleEl.textContent = "Credit/Debit Card";
    if (methodIconEl) {
      methodIconEl.innerHTML = `<img src="assets/images/mastercard.png" alt="Mastercard" class="pay-header-card-img">`;
    }
    if (cardBox) cardBox.style.display = "block";
    if (walletBox) walletBox.style.display = "none";
  } else {
    // VISA / Default Credit Card
    if (methodTitleEl) methodTitleEl.textContent = "Credit/Debit Card";
    if (methodIconEl) {
      methodIconEl.innerHTML = `<img src="${payIcon}" alt="Card" class="pay-header-card-img">`;
    }
    if (cardBox) cardBox.style.display = "block";
    if (walletBox) walletBox.style.display = "none";
  }

  modal.classList.add("open");
}

function setupPaymentGateway() {
  const modal = document.getElementById("paymentModal");
  const closeBtn = document.getElementById("payCloseBtn");
  const detailsToggle = document.getElementById("payDetailsToggle");
  const detailsDropdown = document.getElementById("payDetailsDropdown");
  const nextBtn = document.getElementById("nextStepBtn");

  const cardNumberInput = document.getElementById("payCardNumber");
  const cardExpiryInput = document.getElementById("payCardExpiry");
  const submitBtn = document.getElementById("paySubmitBtn");
  const walletBtn = document.getElementById("payWalletBtn");
  const receiptDoneBtn = document.getElementById("receiptDoneBtn");

  if (!modal) return;

  // Stored Gold Coins page Next Step button
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const title = selectedPackage ? selectedPackage.coins : "3000 Gold Coins";
      const price = selectedPackage ? formatPrice(selectedPackage.price) : formatPrice(4.99);
      openPaymentGateway(title, price);
    });
  }

  // Close modal
  function closePayModal() {
    modal.classList.remove("open");
  }

  if (closeBtn) closeBtn.addEventListener("click", closePayModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closePayModal();
  });

  // Toggle order details dropdown
  if (detailsToggle && detailsDropdown) {
    detailsToggle.addEventListener("click", () => {
      detailsDropdown.classList.toggle("open");
    });
  }

  // Auto-format card number input (4-digit spacing)
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 16);
      let formatted = val.replace(/(.{4})/g, "$1 ").trim();
      e.target.value = formatted;
    });
  }

  // Auto-format expiry date (MM/YY)
  if (cardExpiryInput) {
    cardExpiryInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 4);
      if (val.length >= 3) {
        val = val.substring(0, 2) + "/" + val.substring(2);
      }
      e.target.value = val;
    });
  }

  const cardCvvInput = document.getElementById("payCardCvv");
  const cardHolderInput = document.getElementById("payCardHolder");

  // Clear invalid styling when user types
  [cardNumberInput, cardExpiryInput, cardCvvInput, cardHolderInput].forEach(input => {
    if (input) {
      input.addEventListener("input", () => {
        input.classList.remove("invalid-input");
      });
    }
  });

  // Process Payment submission with validation
  function handlePaymentProcessing(btn) {
    // Check if card box is active (VISA / Mastercard)
    const cardBox = document.getElementById("payCardBox");
    const isCardForm = cardBox && cardBox.style.display !== "none";

    if (isCardForm) {
      const rawCardNum = cardNumberInput ? cardNumberInput.value.replace(/\s/g, "") : "";
      const rawExpiry = cardExpiryInput ? cardExpiryInput.value.trim() : "";
      const rawCvv = cardCvvInput ? cardCvvInput.value.trim() : "";
      const rawHolder = cardHolderInput ? cardHolderInput.value.trim() : "";

      let isValid = true;

      // Validate 16-digit card number
      if (!rawCardNum || rawCardNum.length < 16 || !/^\d{16}$/.test(rawCardNum)) {
        if (cardNumberInput) cardNumberInput.classList.add("invalid-input");
        isValid = false;
      }

      // Validate MM/YY expiry
      if (!rawExpiry || !/^\d{2}\/\d{2}$/.test(rawExpiry)) {
        if (cardExpiryInput) cardExpiryInput.classList.add("invalid-input");
        isValid = false;
      }

      // Validate 3-4 digit CVV
      if (!rawCvv || rawCvv.length < 3 || !/^\d{3,4}$/.test(rawCvv)) {
        if (cardCvvInput) cardCvvInput.classList.add("invalid-input");
        isValid = false;
      }

      // Validate cardholder name
      if (!rawHolder) {
        if (cardHolderInput) cardHolderInput.classList.add("invalid-input");
        isValid = false;
      }

      if (!isValid) {
        showToast("⚠️ Please fill in all valid card details before proceeding.");
        return;
      }
    }

    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "Processing Payment...";

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = origText;

      // Clear card input fields after successful payment
      if (cardNumberInput) cardNumberInput.value = "";
      if (cardExpiryInput) cardExpiryInput.value = "";
      if (cardCvvInput) cardCvvInput.value = "";
      if (cardHolderInput) cardHolderInput.value = "";

      // Switch to Payment Receipt View
      const checkoutView = document.getElementById("payViewCheckout");
      const receiptView = document.getElementById("payViewReceipt");
      if (checkoutView && receiptView) {
        checkoutView.style.display = "none";
        receiptView.style.display = "block";
      }

      // Populate Receipt Details
      const activeUser = loggedInUser || appData.site.user || { name: "Wu Chen", id: "wuchen" };
      const title = document.getElementById("paySummaryItemTitle")?.textContent || "Gold Coins";
      const price = document.getElementById("paySummaryBigPrice")?.textContent || "$4.99";
      const tx = document.getElementById("payTxId")?.textContent || "T20260925209429";

      const receiptTxId = document.getElementById("receiptTxId");
      const receiptPlayer = document.getElementById("receiptPlayer");
      const receiptItem = document.getElementById("receiptItem");
      const receiptMethod = document.getElementById("receiptMethod");
      const receiptAmount = document.getElementById("receiptAmount");
      const receiptDate = document.getElementById("receiptDate");

      if (receiptTxId) receiptTxId.textContent = tx;
      if (receiptPlayer) receiptPlayer.textContent = `${activeUser.name} (${activeUser.id})`;
      if (receiptItem) receiptItem.textContent = title;
      if (receiptMethod) receiptMethod.textContent = selectedPayment ? selectedPayment.name : "VISA Card";
      if (receiptAmount) receiptAmount.textContent = price;
      if (receiptDate) {
        const d = new Date();
        const formatted = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") + " " + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
        receiptDate.textContent = formatted;
      }
    }, 1200);
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", () => handlePaymentProcessing(submitBtn));
  }

  if (walletBtn) {
    walletBtn.addEventListener("click", () => handlePaymentProcessing(walletBtn));
  }

  if (receiptDoneBtn) {
    receiptDoneBtn.addEventListener("click", () => {
      closePayModal();
      showToast("🎉 Payment confirmed! Coins deposited.");
    });
  }
}

/**
 * Setup "How to get user ID?" modal popup (Reference Image 2)
 */
function setupIdHelpModal() {
  const modal = document.getElementById("howToGetIdModal");
  const openBtn = document.getElementById("openIdHelpBtn");
  const openQrBtn = document.getElementById("openQrHelpBtn");
  const closeBtn = document.getElementById("idHelpCloseBtn");

  if (!modal) return;

  if (openBtn) {
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("open");
    });
  }

  if (openQrBtn) {
    openQrBtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("open");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
    }
  });
}

/**
 * Countdown Timer underneath the gift box icon
 * Counts down every second from 95:22:46
 */
function setupCountdownTimer() {
  const timerEl = document.getElementById("packTimer");
  if (!timerEl) return;

  function updateDisplay() {
    if (countdownTotalSeconds <= 0) {
      timerEl.textContent = "00:00:00";
      return;
    }

    const hours = Math.floor(countdownTotalSeconds / 3600);
    const minutes = Math.floor((countdownTotalSeconds % 3600) / 60);
    const seconds = countdownTotalSeconds % 60;

    const pad = (n) => String(n).padStart(2, "0");
    timerEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  updateDisplay();

  setInterval(() => {
    if (countdownTotalSeconds > 0) {
      countdownTotalSeconds--;
      updateDisplay();
    }
  }, 1000);
}

/**
 * Toast Notification Utility
 */
function showToast(message) {
  let toast = document.getElementById("globalToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "globalToast";
    toast.className = "toast-msg";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/**
 * Setup Red Envelope Page (Package selection, Quantity 1/5/10 calculation, Email, Checkout)
 */
function setupRedEnvelopePage() {
  const container = document.getElementById("redEnvPackagesList");
  const qtyGrid = document.getElementById("redEnvQtyGrid");
  const summaryVal = document.getElementById("redEnvSummaryPriceVal");
  const nextBtn = document.getElementById("redEnvNextStepBtn");
  const billTrigger = document.getElementById("redEnvBillBtn");
  const billInputBox = document.getElementById("redEnvBillInputBox");
  const emailInput = document.getElementById("redEnvEmailInput");
  const saveBtn = document.getElementById("redEnvEmailSaveBtn");
  const savedDisplay = document.getElementById("redEnvSavedEmailDisplay");
  const savedText = document.getElementById("redEnvSavedEmailText");
  const editBtn = document.getElementById("redEnvEditEmailBtn");

  if (!container) return;

  let unitPrice = 4.99;
  let currentQty = 1;
  let currentTitle = "3000 Gold Coins Red Packet";

  function updateTotal() {
    const totalUSD = unitPrice * currentQty;
    if (summaryVal) summaryVal.textContent = formatPrice(totalUSD);
  }

  const cards = container.querySelectorAll(".package-item");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      unitPrice = parseFloat(card.dataset.price);
      currentTitle = card.dataset.name;
      updateTotal();
    });
  });

  if (qtyGrid) {
    const qtyBtns = qtyGrid.querySelectorAll(".qty-btn");
    qtyBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        qtyBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentQty = parseInt(btn.dataset.qty);
        updateTotal();
      });
    });
  }

  if (billTrigger && billInputBox) {
    billTrigger.addEventListener("click", () => {
      billTrigger.style.display = "none";
      billInputBox.classList.add("open");
      emailInput.focus();
    });

    function saveRedEmail() {
      const val = emailInput.value.trim();
      if (val && val.includes("@") && val.includes(".")) {
        userEmail = val;
        savedText.textContent = userEmail;
        billInputBox.classList.remove("open");
        savedDisplay.classList.add("active");
        showToast("Email saved! Lucky reward unlocked.");
      } else {
        showToast("Please enter a valid email address.");
        emailInput.focus();
      }
    }

    if (saveBtn) saveBtn.addEventListener("click", saveRedEmail);
    if (emailInput) {
      emailInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveRedEmail();
      });
    }
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        savedDisplay.classList.remove("active");
        billInputBox.classList.add("open");
        emailInput.focus();
      });
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const totalUSD = unitPrice * currentQty;
      openPaymentGateway(`${currentTitle} (x${currentQty})`, formatPrice(totalUSD));
    });
  }
}

/**
 * Setup Game Card Upgrade 1st Option (Version cards)
 */
function setupGameCard1Page() {
  const grid = document.getElementById("gameCard1Grid");
  const summaryVal = document.getElementById("gameCard1SummaryPriceVal");
  const nextBtn = document.getElementById("gameCard1NextStepBtn");
  const billTrigger = document.getElementById("gameCard1BillBtn");
  const billInputBox = document.getElementById("gameCard1BillInputBox");
  const emailInput = document.getElementById("gameCard1EmailInput");
  const saveBtn = document.getElementById("gameCard1EmailSaveBtn");
  const savedDisplay = document.getElementById("gameCard1SavedEmailDisplay");
  const savedText = document.getElementById("gameCard1SavedEmailText");
  const editBtn = document.getElementById("gameCard1EditEmailBtn");

  if (!grid) return;

  const boxes = grid.querySelectorAll(".game-card-box");
  boxes.forEach(box => {
    box.addEventListener("click", () => {
      boxes.forEach(b => b.classList.remove("selected"));
      box.classList.add("selected");
      const price = parseFloat(box.dataset.price);
      if (summaryVal) summaryVal.textContent = formatPrice(price);
    });
  });

  if (billTrigger && billInputBox) {
    billTrigger.addEventListener("click", () => {
      billTrigger.style.display = "none";
      billInputBox.classList.add("open");
      emailInput.focus();
    });

    function saveGc1Email() {
      const val = emailInput.value.trim();
      if (val && val.includes("@") && val.includes(".")) {
        userEmail = val;
        savedText.textContent = userEmail;
        billInputBox.classList.remove("open");
        savedDisplay.classList.add("active");
        showToast("Email saved! Lucky reward unlocked.");
      } else {
        showToast("Please enter a valid email address.");
        emailInput.focus();
      }
    }

    if (saveBtn) saveBtn.addEventListener("click", saveGc1Email);
    if (emailInput) {
      emailInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveGc1Email();
      });
    }
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        savedDisplay.classList.remove("active");
        billInputBox.classList.add("open");
        emailInput.focus();
      });
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const selected = grid.querySelector(".game-card-box.selected");
      const name = selected ? selected.dataset.name : "Game Card Advanced Version";
      const basePrice = selected ? parseFloat(selected.dataset.price) : 7.99;
      openPaymentGateway(name, formatPrice(basePrice));
    });
  }
}

/**
 * Setup Game Card Upgrade 2nd Option (Level cards)
 */
function setupGameCard2Page() {
  const grid = document.getElementById("gameCard2Grid");
  const summaryVal = document.getElementById("gameCard2SummaryPriceVal");
  const nextBtn = document.getElementById("gameCard2NextStepBtn");
  const billTrigger = document.getElementById("gameCard2BillBtn");
  const billInputBox = document.getElementById("gameCard2BillInputBox");
  const emailInput = document.getElementById("gameCard2EmailInput");
  const saveBtn = document.getElementById("gameCard2EmailSaveBtn");
  const savedDisplay = document.getElementById("gameCard2SavedEmailDisplay");
  const savedText = document.getElementById("gameCard2SavedEmailText");
  const editBtn = document.getElementById("gameCard2EditEmailBtn");

  if (!grid) return;

  const cards = grid.querySelectorAll(".member-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      const price = parseFloat(card.dataset.price);
      if (summaryVal) summaryVal.textContent = formatPrice(price);
    });
  });

  if (billTrigger && billInputBox) {
    billTrigger.addEventListener("click", () => {
      billTrigger.style.display = "none";
      billInputBox.classList.add("open");
      emailInput.focus();
    });

    function saveGc2Email() {
      const val = emailInput.value.trim();
      if (val && val.includes("@") && val.includes(".")) {
        userEmail = val;
        savedText.textContent = userEmail;
        billInputBox.classList.remove("open");
        savedDisplay.classList.add("active");
        showToast("Email saved! Lucky reward unlocked.");
      } else {
        showToast("Please enter a valid email address.");
        emailInput.focus();
      }
    }

    if (saveBtn) saveBtn.addEventListener("click", saveGc2Email);
    if (emailInput) {
      emailInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveGc2Email();
      });
    }
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        savedDisplay.classList.remove("active");
        billInputBox.classList.add("open");
        emailInput.focus();
      });
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const selected = grid.querySelector(".member-card.selected");
      const name = selected ? selected.dataset.name : "Level 10";
      const basePrice = selected ? parseFloat(selected.dataset.price) : 11.99;
      openPaymentGateway(name, formatPrice(basePrice));
    });
  }
}

let loggedInUser = null;
let pendingUser = null;

/**
 * Initial Login & Verification Flow (Images 1, 2, 3 Reference)
 */
function setupLoginFlow() {
  const overlay = document.getElementById("loginOverlay");
  const step1 = document.getElementById("loginStep1");
  const step2 = document.getElementById("loginStep2");
  const tabScan = document.getElementById("tabScanLogin");
  const tabEnter = document.getElementById("tabEnterAccount");
  const contentScan = document.getElementById("contentScanLogin");
  const contentEnter = document.getElementById("contentEnterAccount");
  const idInput = document.getElementById("loginUserIdInput");
  const errorMsg = document.getElementById("loginErrorMsg");
  const nextBtn = document.getElementById("loginNextBtn");
  const confirmAvatar = document.getElementById("confirmUserAvatarImg");
  const confirmName = document.getElementById("confirmUserName");
  const cancelBtn = document.getElementById("confirmCancelBtn");
  const okBtn = document.getElementById("confirmOkBtn");
  const switchBtn = document.getElementById("switchAccountBtn");

  if (!overlay) return;

  // Restore stored session if exists
  const storedUser = localStorage.getItem("weplay_logged_user");
  if (storedUser) {
    try {
      loggedInUser = JSON.parse(storedUser);
      applyLoggedInUser(loggedInUser);
      overlay.classList.remove("open");
    } catch (e) {}
  } else {
    overlay.classList.add("open");
  }

  // Tab Switching (Scan to log in vs Enter your WePlay account)
  if (tabScan && tabEnter) {
    tabScan.addEventListener("click", () => {
      tabScan.classList.add("active");
      tabEnter.classList.remove("active");
      contentScan.style.display = "block";
      contentEnter.style.display = "none";
      document.getElementById("loginStep1Title").textContent = "Scan code to login";
    });

    tabEnter.addEventListener("click", () => {
      tabEnter.classList.add("active");
      tabScan.classList.remove("active");
      contentEnter.style.display = "block";
      contentScan.style.display = "none";
      document.getElementById("loginStep1Title").textContent = "Enter your WePlay ID";
    });
  }

  // Clear error warning on input
  if (idInput && errorMsg) {
    idInput.addEventListener("input", () => {
      errorMsg.classList.remove("show");
    });
    idInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") verifyUser();
    });
  }

  // Verify ID on Next Step
  if (nextBtn) {
    nextBtn.addEventListener("click", verifyUser);
  }

  async function verifyUser() {
    const inputVal = idInput ? idInput.value.trim() : "";
    if (!inputVal) {
      if (errorMsg) {
        errorMsg.textContent = "user doesn't exist";
        errorMsg.classList.add("show");
      }
      return;
    }

    if (errorMsg) errorMsg.classList.remove("show");

    // Clean loading state without magnifying glass
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.dataset.originalText = nextBtn.textContent;
      nextBtn.textContent = "Verifying...";
      nextBtn.style.opacity = "0.75";
    }

    try {
      const res = await fetch(`/api/weplay?id=${encodeURIComponent(inputVal)}`);
      const json = await res.json();

      if (json && json.success && json.data) {
        pendingUser = json.data;
        showConfirmStep(json.data);
      } else {
        if (errorMsg) {
          errorMsg.textContent = "user doesn't exist";
          errorMsg.classList.add("show");
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
      if (errorMsg) {
        errorMsg.textContent = "Connection error — is the server running?";
        errorMsg.classList.add("show");
      }
    } finally {
      // Restore button
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.textContent = nextBtn.dataset.originalText || "Next";
        nextBtn.style.opacity = "1";
      }
    }
  }

  function showConfirmStep(user) {
    if (step1 && step2) {
      step1.style.display = "none";
      step2.style.display = "flex";

      if (confirmName) confirmName.textContent = user.name || "User";
      if (confirmAvatar) {
        confirmAvatar.src = user.dp || "assets/images/logo.png";
      }
      const confirmValEl = document.getElementById("confirmUserValue");
      if (confirmValEl) {
        confirmValEl.textContent = user.charm ? `Captivity Value:${user.charm}` : "Captivity Value:0";
      }
    }
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      if (step1 && step2) {
        step2.style.display = "none";
        step1.style.display = "block";
      }
    });
  }

  if (okBtn) {
    okBtn.addEventListener("click", async () => {
      if (pendingUser) {
        loggedInUser = pendingUser;
        localStorage.setItem("weplay_logged_user", JSON.stringify(loggedInUser));

        // Persist to server users.json
        try {
          await fetch("/api/save-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loggedInUser)
          });
        } catch (e) {}

        applyLoggedInUser(loggedInUser);
        overlay.classList.remove("open");
        showToast(`Welcome, ${loggedInUser.name}! Account verified.`);
      }
    });
  }

  // Switch Account button (two arrows ⇄) takes directly to login page step 1
  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      if (idInput) {
        idInput.value = "";
      }
      if (errorMsg) errorMsg.classList.remove("show");
      if (step1 && step2) {
        step2.style.display = "none";
        step1.style.display = "block";
      }
      overlay.classList.add("open");
      if (idInput) idInput.focus();
    });
  }
}

function applyLoggedInUser(user) {
  if (!user) return;
  const nameEl = document.getElementById("userNameDisplay");
  const idEl = document.getElementById("userIdDisplay");
  const modalAccountEl = document.getElementById("modalItemAccount");
  const avatarWrap = document.getElementById("userAvatarWrap");

  if (nameEl) nameEl.textContent = user.name || "User";
  if (idEl) idEl.textContent = `ID: ${user.id || ""}`;
  if (modalAccountEl) modalAccountEl.textContent = `${user.name || "User"} (ID: ${user.id || ""})`;

  // Replace default SVG avatar with real user profile picture
  if (avatarWrap && user.dp) {
    const avatar = document.createElement('img');
    avatar.src = user.dp;
    avatar.alt = user.name || 'User';
    avatar.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
    avatar.addEventListener('error', () => { avatar.style.display = 'none'; });
    avatarWrap.replaceChildren(avatar);
  }
}


