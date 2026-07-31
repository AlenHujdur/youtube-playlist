const STORAGE_KEY = "youtube-playlist-links";
const LANGUAGE_STORAGE_KEY = "youtube-playlist-language";
const TITLE_STORAGE_KEY = "youtube-playlist-video-titles";
const DEFAULT_LANGUAGE = "bs";
const RESET_PASSWORD = "brisi";

const translations = {
  bs: {
    addButton: "Dodaj",
    addLinkLabel: "Dodaj YouTube link",
    ariaPlaylist: "Lista videa",
    cancelResetButton: "Odustani",
    confirmResetButton: "Potvrdi",
    currentLabel: "Trenutno se prikazuje",
    duplicateVideo: "Video je vec u playlisti.",
    emptyPlaylist: "Playlist je prazna.",
    eyebrow: "Video kolekcija",
    invalidUrl: "Unesi ispravan YouTube link.",
    languageLabel: "Jezik",
    linkPlaceholder: "https://youtu.be/...",
    noVideos: "Nema videa",
    openYoutube: "Otvori na YouTube",
    pageTitle: "YouTube Playlist",
    pendingTitle: "Ucitavanje naziva...",
    playVideo: "Pusti video",
    playVideoAria: "Pusti YouTube video",
    playlistReset: "Playlist je vracen na pocetne linkove.",
    playlistTitle: "Playlist",
    resetButton: "Reset",
    resetPasswordHint: "Unesi password da vratis originalnih 5 videa.",
    resetPasswordInvalid: "Pogresan password. Reset nije uradjen.",
    resetPasswordLabel: "Password za reset",
    resetPasswordPlaceholder: "Unesi password",
    resetPasswordRequired: "Prvo unesi password.",
    videoAdded: "Video je dodan.",
    videoFallback: "YouTube video",
    videoLabel: "Video",
  },
  nl: {
    addButton: "Toevoegen",
    addLinkLabel: "YouTube-link toevoegen",
    ariaPlaylist: "Videolijst",
    cancelResetButton: "Annuleren",
    confirmResetButton: "Bevestigen",
    currentLabel: "Wordt nu afgespeeld",
    duplicateVideo: "Video staat al in de afspeellijst.",
    emptyPlaylist: "De afspeellijst is leeg.",
    eyebrow: "Videocollectie",
    invalidUrl: "Voer een geldige YouTube-link in.",
    languageLabel: "Taal",
    linkPlaceholder: "https://youtu.be/...",
    noVideos: "Geen video's",
    openYoutube: "Openen op YouTube",
    pageTitle: "YouTube Afspeellijst",
    pendingTitle: "Titel laden...",
    playVideo: "Video afspelen",
    playVideoAria: "YouTube-video afspelen",
    playlistReset: "De afspeellijst is teruggezet naar de standaardlinks.",
    playlistTitle: "Afspeellijst",
    resetButton: "Reset",
    resetPasswordHint: "Voer het wachtwoord in om de originele 5 video's terug te zetten.",
    resetPasswordInvalid: "Verkeerd wachtwoord. Reset niet uitgevoerd.",
    resetPasswordLabel: "Reset-wachtwoord",
    resetPasswordPlaceholder: "Voer wachtwoord in",
    resetPasswordRequired: "Voer eerst het wachtwoord in.",
    videoAdded: "Video toegevoegd.",
    videoFallback: "YouTube-video",
    videoLabel: "Video",
  },
};

const defaultVideos = [
  "https://youtu.be/Oz7LAHdFVYg?si=M36TAX4Egdlkmt-x",
  "https://youtu.be/THIOdRYYELE?si=1Y4rNfrQtTxrPC8y",
  "https://youtu.be/B9r4qGdL_6o?si=kVzLANCdW9yYLoTl",
  "https://youtu.be/lEJvhMZ778g?si=mpTSzcUO3VYefu9B",
  "https://youtu.be/zGYiYZw2f78?si=wnQDHSZtkGFTnARC",
  "https://youtu.be/dhhjQK0h_Lc",
];

let titleCache = loadTitleCache();
const pendingTitleRequests = new Set();
const failedTitleRequests = new Set();

const elements = {
  addForm: document.querySelector("#addForm"),
  cancelResetButton: document.querySelector("#cancelResetButton"),
  currentTitle: document.querySelector("#currentTitle"),
  formMessage: document.querySelector("#formMessage"),
  languageSelect: document.querySelector("#languageSelect"),
  openYoutube: document.querySelector("#openYoutube"),
  playlistPanel: document.querySelector(".playlist-panel"),
  resetButton: document.querySelector("#resetButton"),
  resetForm: document.querySelector("#resetForm"),
  resetMessage: document.querySelector("#resetMessage"),
  resetPassword: document.querySelector("#resetPassword"),
  videoCount: document.querySelector("#videoCount"),
  videoFrame: document.querySelector("#videoFrame"),
  videoList: document.querySelector("#videoList"),
  youtubeUrl: document.querySelector("#youtubeUrl"),
};

let videos = loadVideos();
let activeVideoId = videos[0]?.id ?? "";
let currentLanguage = loadLanguage();
let currentMessageKey = "";
let currentResetMessageKey = "";

render();
requestMissingVideoTitles();

elements.languageSelect.addEventListener("change", () => {
  currentLanguage = getSupportedLanguage(elements.languageSelect.value);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  render();
});

elements.addForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const rawUrl = elements.youtubeUrl.value.trim();
  const parsed = parseYoutubeUrl(rawUrl);

  if (!parsed) {
    showMessage("invalidUrl");
    return;
  }

  if (videos.some((video) => video.id === parsed.id)) {
    activeVideoId = parsed.id;
    elements.youtubeUrl.value = "";
    showMessage("duplicateVideo");
    render();
    return;
  }

  videos = [...videos, parsed];
  activeVideoId = parsed.id;
  saveVideos();
  elements.youtubeUrl.value = "";
  showMessage("videoAdded");
  render();
  requestMissingVideoTitles();
});

elements.resetButton.addEventListener("click", () => {
  showResetForm();
});

elements.cancelResetButton.addEventListener("click", () => {
  hideResetForm();
});

elements.resetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const password = elements.resetPassword.value.trim();

  if (!password) {
    showResetMessage("resetPasswordRequired");
    return;
  }

  if (password !== RESET_PASSWORD) {
    showResetMessage("resetPasswordInvalid");
    elements.resetPassword.select();
    return;
  }

  videos = defaultVideos.map((url) => parseYoutubeUrl(url)).filter(Boolean);
  activeVideoId = videos[0]?.id ?? "";
  saveVideos();
  hideResetForm();
  showMessage("playlistReset");
  render();
  requestMissingVideoTitles();
});

function loadLanguage() {
  return getSupportedLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE);
}

function getSupportedLanguage(language) {
  return Object.prototype.hasOwnProperty.call(translations, language) ? language : DEFAULT_LANGUAGE;
}

function t(key) {
  return translations[currentLanguage][key] || translations[DEFAULT_LANGUAGE][key] || key;
}

function loadTitleCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(TITLE_STORAGE_KEY) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

function saveTitleCache() {
  localStorage.setItem(TITLE_STORAGE_KEY, JSON.stringify(titleCache));
}

function loadVideos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const savedVideos = Array.isArray(saved)
      ? saved.map((url) => parseYoutubeUrl(url)).filter(Boolean)
      : [];

    return uniqueVideos([
      ...defaultVideos.map((url) => parseYoutubeUrl(url)).filter(Boolean),
      ...savedVideos,
    ]);
  } catch {
    return defaultVideos.map((url) => parseYoutubeUrl(url)).filter(Boolean);
  }
}

function saveVideos() {
  const customUrls = videos
    .filter((video) => !defaultVideos.some((url) => parseYoutubeUrl(url)?.id === video.id))
    .map((video) => video.url);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(customUrls));
}

function uniqueVideos(items) {
  const byId = new Map();
  items.forEach((item) => {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  });
  return [...byId.values()];
}

function parseYoutubeUrl(value) {
  try {
    const normalizedValue = value.startsWith("http") ? value : `https://${value}`;
    const url = new URL(normalizedValue);
    const hostname = url.hostname.replace(/^www\./, "");
    let id = "";

    if (hostname === "youtu.be") {
      id = url.pathname.slice(1);
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v") || "";
      } else if (
        url.pathname.startsWith("/shorts/") ||
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/live/")
      ) {
        id = url.pathname.split("/")[2] || "";
      }
    }

    id = id.replace(/[^a-zA-Z0-9_-]/g, "");

    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return null;
    }

    return {
      id,
      title: titleCache[id] || "",
      url: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
}

function render() {
  renderLanguage();
  elements.videoCount.textContent = countLabel(videos.length);

  if (!videos.length) {
    elements.videoFrame.src = "";
    elements.videoFrame.removeAttribute("srcdoc");
    elements.currentTitle.textContent = t("noVideos");
    elements.openYoutube.href = "#";
    elements.openYoutube.setAttribute("aria-disabled", "true");
    elements.videoList.innerHTML = "";
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = t("emptyPlaylist");
    elements.videoList.append(emptyState);
    return;
  }

  const activeVideo = videos.find((video) => video.id === activeVideoId) || videos[0];
  activeVideoId = activeVideo.id;

  const embedSrc = `${activeVideo.embedUrl}?rel=0&playsinline=1`;
  elements.videoFrame.src = embedSrc;
  elements.videoFrame.srcdoc = buildVideoPreview(activeVideo);
  elements.currentTitle.textContent = getDisplayTitle(activeVideo);
  elements.openYoutube.href = activeVideo.url;
  elements.openYoutube.removeAttribute("aria-disabled");

  elements.videoList.innerHTML = "";

  videos.forEach((video, index) => {
    const button = document.createElement("button");
    button.className = `video-item${video.id === activeVideo.id ? " is-active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-pressed", String(video.id === activeVideo.id));
    button.addEventListener("click", () => {
      activeVideoId = video.id;
      render();
    });

    const thumbnail = document.createElement("img");
    thumbnail.src = video.thumbnail;
    thumbnail.alt = "";
    thumbnail.loading = "lazy";

    const textWrap = document.createElement("span");
    textWrap.className = "video-copy";
    const title = document.createElement("span");
    title.className = "video-title";
    title.textContent = getDisplayTitle(video);
    title.title = getDisplayTitle(video);

    const url = document.createElement("span");
    url.className = "video-url";
    url.textContent = video.url;

    textWrap.append(title, url);
    button.append(thumbnail, textWrap);
    elements.videoList.append(button);
  });
}

function countLabel(count) {
  if (count === 1) {
    return "1 video";
  }

  if (currentLanguage === "nl") {
    return `${count} video's`;
  }

  return `${count} videa`;
}

function showMessage(messageKey) {
  currentMessageKey = messageKey;
  elements.formMessage.textContent = t(messageKey);
}

function requestMissingVideoTitles() {
  videos.forEach((video) => {
    if (video.title || pendingTitleRequests.has(video.id) || failedTitleRequests.has(video.id)) {
      return;
    }

    pendingTitleRequests.add(video.id);
    fetchVideoTitle(video)
      .then((title) => {
        if (!title) {
          failedTitleRequests.add(video.id);
          return;
        }

        titleCache = { ...titleCache, [video.id]: title };
        saveTitleCache();
        videos = videos.map((item) => (item.id === video.id ? { ...item, title } : item));
        render();
      })
      .catch(() => {
        failedTitleRequests.add(video.id);
        render();
      })
      .finally(() => {
        pendingTitleRequests.delete(video.id);
      });
  });
}

async function fetchVideoTitle(video) {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(video.url)}&format=json`,
  );

  if (!response.ok) {
    throw new Error(`YouTube title request failed with ${response.status}`);
  }

  const data = await response.json();
  return typeof data.title === "string" ? data.title.trim() : "";
}

function showResetForm() {
  elements.resetForm.hidden = false;
  elements.resetButton.setAttribute("aria-expanded", "true");
  elements.resetPassword.value = "";
  showResetMessage("");
  elements.resetPassword.focus();
}

function hideResetForm() {
  elements.resetForm.hidden = true;
  elements.resetButton.setAttribute("aria-expanded", "false");
  elements.resetPassword.value = "";
  showResetMessage("");
}

function showResetMessage(messageKey) {
  currentResetMessageKey = messageKey;
  elements.resetMessage.textContent = messageKey ? t(messageKey) : "";
}

function getDisplayTitle(video) {
  if (video.title) {
    return video.title;
  }

  return failedTitleRequests.has(video.id) ? t("videoFallback") : t("pendingTitle");
}

function renderLanguage() {
  document.documentElement.lang = currentLanguage;
  document.title = t("pageTitle");
  elements.languageSelect.value = currentLanguage;
  elements.playlistPanel.setAttribute("aria-label", t("ariaPlaylist"));

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });

  if (currentMessageKey) {
    elements.formMessage.textContent = t(currentMessageKey);
  }

  if (currentResetMessageKey) {
    elements.resetMessage.textContent = t(currentResetMessageKey);
  }
}

function buildVideoPreview(video) {
  const playUrl = `${video.embedUrl}?autoplay=1&rel=0&playsinline=1`;

  return `
    <style>
      * {
        box-sizing: border-box;
      }

      html,
      body,
      a {
        width: 100%;
        height: 100%;
        margin: 0;
      }

      body {
        overflow: hidden;
        background: #05070a;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      a,
      img,
      span {
        position: absolute;
      }

      a {
        inset: 0;
        display: block;
        color: #ffffff;
        text-decoration: none;
      }

      img {
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .shade {
        inset: 0;
        background: rgba(0, 0, 0, 0.14);
      }

      .play {
        left: 50%;
        top: 50%;
        width: 74px;
        height: 52px;
        border-radius: 8px;
        background: #df2f28;
        transform: translate(-50%, -50%);
      }

      .play::before {
        content: "";
        position: absolute;
        left: 29px;
        top: 15px;
        width: 0;
        height: 0;
        border-top: 11px solid transparent;
        border-bottom: 11px solid transparent;
        border-left: 18px solid #ffffff;
      }

      .label {
        left: 16px;
        bottom: 14px;
        max-width: calc(100% - 32px);
        padding: 8px 10px;
        border-radius: 8px;
        color: #ffffff;
        background: rgba(0, 0, 0, 0.58);
        font-size: 14px;
        font-weight: 800;
        line-height: 1.2;
      }
    </style>
    <a href="${playUrl}" aria-label="${t("playVideoAria")}">
      <img src="${video.thumbnail}" alt="" />
      <span class="shade"></span>
      <span class="play"></span>
      <span class="label">${t("playVideo")}</span>
    </a>
  `;
}
