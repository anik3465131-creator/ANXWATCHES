/* ============================================================
   ANX WATCHES — script.js
   ============================================================ */

(function () {
  "use strict";

  /* Номера, которые уже заняты, например: ["03", "07"] */
  const TAKEN_NUMBERS = [];

  const REDUCED =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE_POINTER = window.matchMedia("(pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  /* ----------------------------------------------------------
     Header + progress bar
     ---------------------------------------------------------- */

  const header = document.querySelector(".site-header");
  const progressBar = document.getElementById("progressBar");

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 40);

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      progressBar.style.transform = "scaleX(" + progress.toFixed(4) + ")";
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ----------------------------------------------------------
     Year
     ---------------------------------------------------------- */

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------
     Series: 20 numbers
     ---------------------------------------------------------- */

  const cells = Array.from(document.querySelectorAll(".cell"));
  let freeCount = cells.length;

  cells.forEach(function (cell) {
    const num = cell.getAttribute("data-num");
    if (TAKEN_NUMBERS.indexOf(num) === -1) return;

    freeCount -= 1;
    cell.classList.add("taken");
    cell.disabled = true;
    cell.removeAttribute("href");
    cell.removeAttribute("target");
    cell.removeAttribute("rel");
    cell.setAttribute("aria-disabled", "true");
    const status = cell.querySelector(".cell-status");
    if (status) status.textContent = "занят";
  });

  const seriesStatus = document.querySelector(".series-status");
  if (seriesStatus) {
    seriesStatus.innerHTML =
      '<span class="dot" aria-hidden="true"></span>' +
      "Свободно " + freeCount + " из 20";
  }

  /* Подсветка ячейки за курсором */
  cells.forEach(function (cell) {
    cell.addEventListener("mousemove", function (event) {
      const rect = cell.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * 100;
      const py = ((event.clientY - rect.top) / rect.height) * 100;
      cell.style.setProperty("--px", px + "%");
      cell.style.setProperty("--py", py + "%");
    });
  });

  /* ----------------------------------------------------------
     LUME
     ---------------------------------------------------------- */

  const lumeBtn = document.querySelector(".lume-btn");
  const LUME_KEY = "anx-lume";

  function readLume() {
    try {
      return window.localStorage.getItem(LUME_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function saveLume(on) {
    try {
      window.localStorage.setItem(LUME_KEY, on ? "1" : "0");
    } catch (err) {
      /* localStorage недоступен — просто не сохраняем */
    }
  }

  function applyLume(on) {
    document.body.classList.toggle("lume", on);
    if (lumeBtn) {
      lumeBtn.setAttribute("aria-pressed", on ? "true" : "false");
      lumeBtn.setAttribute(
        "aria-label",
        on ? "Выключить подсветку LUME" : "Включить подсветку LUME"
      );
    }
    document.dispatchEvent(
      new CustomEvent("anx:lume", { detail: on })
    );
  }

  applyLume(readLume());

  if (lumeBtn) {
    lumeBtn.addEventListener("click", function () {
      const next = !document.body.classList.contains("lume");
      applyLume(next);
      saveLume(next);
    });
  }

  /* ----------------------------------------------------------
     Живой циферблат: стрелки и дата
     ---------------------------------------------------------- */

  const handHour = document.querySelector(".dial-hand-hour");
  const handMinute = document.querySelector(".dial-hand-minute");
  const handSecond = document.querySelector(".dial-hand-second");
  const dialDate = document.getElementById("dialDate");
  const hasDial = handHour && handMinute && handSecond;

  function paintDial() {
    const now = new Date();

    if (dialDate) {
      dialDate.textContent = String(now.getDate()).padStart(2, "0");
    }

    if (!hasDial) return;

    const ms = REDUCED ? 0 : now.getMilliseconds();
    const seconds = now.getSeconds() + ms / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    handHour.style.transform = "rotate(" + (hours * 30).toFixed(3) + "deg)";
    handMinute.style.transform = "rotate(" + (minutes * 6).toFixed(3) + "deg)";
    handSecond.style.transform = "rotate(" + (seconds * 6).toFixed(3) + "deg)";
  }

  paintDial();

  if (REDUCED) {
    window.setInterval(paintDial, 1000);
  } else {
    (function tick() {
      paintDial();
      window.requestAnimationFrame(tick);
    })();
  }

  /* ----------------------------------------------------------
     Заказ: одна кнопка и форма
     ---------------------------------------------------------- */

  /* Замените на реальный адрес — заявки уходят письмом */
  const ORDER_EMAIL = "order@anxwatches.example";

  const orderDialog = document.getElementById("orderDialog");
  const orderForm = document.getElementById("orderForm");
  const orderNumber = document.getElementById("orderNumber");
  const orderName = document.getElementById("orderName");
  const orderContact = document.getElementById("orderContact");
  const orderStatus = document.getElementById("orderStatus");

  function openOrder(number) {
    if (!orderDialog) return;
    if (number && orderNumber) orderNumber.value = number;
    if (orderStatus) orderStatus.textContent = "";

    if (typeof orderDialog.showModal === "function") {
      if (!orderDialog.open) orderDialog.showModal();
    } else {
      orderDialog.setAttribute("open", "");
    }

    if (orderName) {
      window.setTimeout(function () {
        orderName.focus();
      }, 60);
    }
  }

  document.querySelectorAll("[data-open-order]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openOrder(null);
    });
  });

  cells.forEach(function (cell) {
    if (cell.disabled) return;
    cell.addEventListener("click", function () {
      openOrder(cell.getAttribute("data-num"));
    });
  });

  if (orderDialog) {
    orderDialog.addEventListener("click", function (event) {
      if (event.target === orderDialog) orderDialog.close();
    });

    orderDialog.querySelectorAll("[data-close-order]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        orderDialog.close();
      });
    });
  }

  if (orderForm) {
    orderForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!orderForm.reportValidity()) return;

      const number = orderNumber ? orderNumber.value : "";
      const name = orderName ? orderName.value.trim() : "";
      const contact = orderContact ? orderContact.value.trim() : "";

      const subject = "Заказ ANX WATCHES — №" + number;
      const body =
        "Номер: " + number +
        "\nИмя: " + name +
        "\nКонтакт: " + contact;

      window.location.href =
        "mailto:" + ORDER_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      if (orderStatus) {
        orderStatus.textContent =
          "Открываем почтовое приложение. Если оно не открылось — напишите на " +
          ORDER_EMAIL + ".";
      }
    });
  }

  /* ----------------------------------------------------------
     Карта механизма
     ---------------------------------------------------------- */

  const mv = document.getElementById("movementMap");

  if (mv) {
    const mvDetail = document.getElementById("mvDetail");
    const mvDots = Array.from(mv.querySelectorAll(".mv-dot"));
    const mvItems = Array.from(mv.querySelectorAll(".mv-item"));

    const MV_PARTS = {
      rotor:
        "Полулунный груз вращается при движении руки и подзаводит пружину. Предусмотрен и ручной завод.",
      balance:
        "Балансовое колесо задаёт темп хода: 21 600 полуколебаний в час.",
      barrel:
        "Заводной барабан хранит энергию пружины. Запас хода — около 41 часа.",
      jewels:
        "24 рубиновых камня снижают трение в опорах и узлах механизма."
    };

    const MV_DEFAULT = "Выберите элемент механизма.";
    let mvPinned = null;

    function mvApply(part) {
      mv.classList.toggle("has-active", Boolean(part));

      mvDots.concat(mvItems).forEach(function (el) {
        const match = Boolean(part) && el.getAttribute("data-part") === part;
        el.classList.toggle("is-active", match);
        el.setAttribute("aria-pressed", match ? "true" : "false");
      });

      if (mvDetail) {
        mvDetail.classList.toggle("is-active", Boolean(part));
        mvDetail.textContent = part ? MV_PARTS[part] : MV_DEFAULT;
      }
    }

    [mvDots, mvItems].forEach(function (group) {
      group.forEach(function (el) {
        const part = el.getAttribute("data-part");

        el.addEventListener("mouseenter", function () {
          mvApply(part);
        });

        el.addEventListener("focus", function () {
          mvApply(part);
        });

        el.addEventListener("click", function () {
          mvPinned = mvPinned === part ? null : part;
          mvApply(mvPinned);
        });
      });
    });

    mv.addEventListener("mouseleave", function () {
      mvApply(mvPinned);
    });

    mvApply(null);
  }

  /* ----------------------------------------------------------
     Motion
     ---------------------------------------------------------- */

  if (!hasGSAP || REDUCED) return;

  const gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  document.documentElement.classList.add("has-motion");

  /* Разбиваем заголовки на слова для построчного появления */
  function splitWords(el) {
    if (el.dataset.split === "done") return;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (word, index) {
      const mask = document.createElement("span");
      mask.className = "split-mask";
      const inner = document.createElement("span");
      inner.className = "split-word";
      inner.textContent = word;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (index < words.length - 1) {
        el.appendChild(document.createTextNode(" "));
      }
    });
    el.dataset.split = "done";
  }

  document.querySelectorAll(".section-title").forEach(splitWords);
  document.querySelectorAll(".split").forEach(splitWords);

  /* ----------------------------------------------------------
     Intro
     ---------------------------------------------------------- */

  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

  intro
    .from(".logo", { opacity: 0, y: -10, letterSpacing: "0.3em", duration: 1.1 }, 0)
    .from(".nav a", { opacity: 0, y: -8, duration: 0.6, stagger: 0.06 }, 0.3)
    .from(".hero-logo", { opacity: 0, letterSpacing: "0.3em", duration: 1.2 }, 0.2)
    .from(".hero-sub", { opacity: 0, y: 10, duration: 0.8 }, 0.7)
    .from(".watch-frame", { opacity: 0, duration: 1.2, ease: "power2.out" }, 0.5)
    .from(".lume-btn", { opacity: 0, scale: 0.7, duration: 0.6 }, 1.1)
    .from(".hero-meta", { opacity: 0, y: 10, duration: 0.8 }, 1.15);

  /* ----------------------------------------------------------
     Блик по часам: следует за курсором, обрезан силуэтом
     ---------------------------------------------------------- */

  const watchFrame = document.querySelector(".watch-frame");
  const watchGlare = document.querySelector(".watch-glare");
  const glareDot = document.querySelector(".watch-glare-dot");
  let glareActive = false;

  if (watchFrame && watchGlare && glareDot && FINE_POINTER) {
    gsap.set(glareDot, { xPercent: -50, yPercent: -50 });

    const glareX = gsap.quickTo(glareDot, "x", { duration: 0.7, ease: "power3" });
    const glareY = gsap.quickTo(glareDot, "y", { duration: 0.7, ease: "power3" });

    watchFrame.addEventListener("mousemove", function (event) {
      const rect = watchFrame.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (!glareActive) {
        glareActive = true;
        gsap.set(glareDot, { x: x, y: y });
      }

      glareX(x);
      glareY(y);
      gsap.to(watchGlare, {
        opacity: document.body.classList.contains("lume") ? 0.3 : 1,
        duration: 0.4,
        overwrite: true
      });
    });

    watchFrame.addEventListener("mouseleave", function () {
      glareActive = false;
      gsap.to(watchGlare, { opacity: 0, duration: 0.5, overwrite: true });
    });

    document.addEventListener("anx:lume", function (event) {
      if (!glareActive) return;
      gsap.to(watchGlare, {
        opacity: event.detail ? 0.3 : 1,
        duration: 0.5,
        overwrite: true
      });
    });
  }

  /* ----------------------------------------------------------
     Скролл-анимации
     ---------------------------------------------------------- */

  function setupScrollMotion() {
    /* Появление блоков */
    gsap.utils.toArray(".reveal-fade").forEach(function (el) {
      if (el.closest(".hero")) return;
      gsap.from(el, {
        opacity: 0,
        y: 18,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true }
      });
    });

    gsap.utils.toArray(".reveal-up").forEach(function (el) {
      if (el.closest(".hero")) return;
      gsap.from(el, {
        opacity: 0,
        y: 28,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true }
      });
    });

    /* Заголовки и строки манифеста — по словам */
    gsap.utils.toArray(".section-title, .split").forEach(function (el) {
      gsap.from(el.querySelectorAll(".split-word"), {
        yPercent: 112,
        duration: 1.05,
        stagger: 0.055,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });

    /* Сетка 20 */
    if (cells.length) {
      gsap.from(cells, {
        opacity: 0,
        y: 26,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.045,
        scrollTrigger: { trigger: ".series-grid", start: "top 92%", once: true }
      });
    }

    /* Счётчики */
    gsap.utils.toArray("[data-count]").forEach(function (el) {
      const target = Number(el.getAttribute("data-count")) || 0;
      const state = { value: 0 };

      el.textContent = "0";

      gsap.to(state, {
        value: target,
        duration: 1.8,
        ease: "power2.out",
        snap: { value: 1 },
        onUpdate: function () {
          el.textContent = String(Math.round(state.value));
        },
        scrollTrigger: { trigger: el, start: "top 92%", once: true }
      });
    });

    window.ScrollTrigger.refresh();
  }

  /* Ждём шрифты и картинки, чтобы ScrollTrigger считал верные позиции */
  function whenReady() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setupScrollMotion);
    } else {
      setupScrollMotion();
    }
  }

  if (document.readyState === "complete") {
    whenReady();
  } else {
    window.addEventListener("load", whenReady);
  }

  /* ----------------------------------------------------------
     Магнитные элементы (CTA и LUME)
     ---------------------------------------------------------- */

  document.querySelectorAll(".magnetic").forEach(function (el) {
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });

    el.addEventListener("mousemove", function (event) {
      const rect = el.getBoundingClientRect();
      xTo((event.clientX - rect.left - rect.width / 2) * 0.18);
      yTo((event.clientY - rect.top - rect.height / 2) * 0.3);
    });

    el.addEventListener("mouseleave", function () {
      xTo(0);
      yTo(0);
    });
  });
})();
