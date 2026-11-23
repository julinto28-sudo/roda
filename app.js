<<<<<<< HEAD
const APP_VERSION = "1.1.0";
const STORAGE_KEY = "roda-maintenance-v2";
const THEME_STORAGE_KEY = "roda-theme";
const VEHICLE_TYPES = ["matic", "chain", "unknown"];
const SERVICE_TEMPLATES = {
  common: [
    { id: "oil", name: "Oli mesin", icon: "🛢️", interval: 2000 },
    { id: "air-filter", name: "Filter udara", icon: "🌬️", interval: 8000 },
    { id: "spark-plug", name: "Busi", icon: "⚡", interval: 8000 },
    { id: "brake-pad", name: "Kampas rem", icon: "🛑", interval: 12000 }
  ],
  matic: [
    { id: "gear-oil", name: "Oli gardan", icon: "⚙️", interval: 8000 },
    { id: "v-belt", name: "V-belt", icon: "〰️", interval: 24000 }
  ],
  chain: [
    { id: "chain", name: "Rantai & gir", icon: "🔗", interval: 1000 }
  ]
};

function emptyState() {
  return { vehicle: null, odometer: 0, odometerLog: [], services: [], history: [], remindersEnabled: false, notifiedReminders: [] };
}

function createServices(type, odometer, catalogModel) {
  const typeSpecific = type === "matic" ? SERVICE_TEMPLATES.matic : type === "chain" ? SERVICE_TEMPLATES.chain : [];
  const schedule = catalogModel?.scheduleVerified ? catalogModel.services : [...SERVICE_TEMPLATES.common, ...typeSpecific];
  return schedule.map(service => {
    const firstIntervalPending = Number.isSafeInteger(service.initialInterval) && odometer < service.initialInterval;
    return {
      ...service,
      interval: firstIntervalPending ? service.initialInterval : service.interval,
      ...(firstIntervalPending ? { repeatInterval: service.interval, lastAt: 0 } : { lastAt: odometer }),
      visible: true
    };
  });
}

function isValidOdometerLog(log, odometer) {
  if (!Array.isArray(log) || !log.length) return false;
  for (let index = 0; index < log.length; index += 1) {
    const entry = log[index];
    if (!entry || !Number.isSafeInteger(entry.odometer) || entry.odometer < 0 || typeof entry.date !== "string") return false;
    const date = Date.parse(entry.date);
    if (!Number.isFinite(date)) return false;
    if (index > 0) {
      const previous = log[index - 1];
      if (entry.odometer <= previous.odometer || date < Date.parse(previous.date)) return false;
    }
  }
  return log[log.length - 1].odometer === odometer;
}

let needsOdometerLogMigration = false;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyState();
    const parsed = JSON.parse(saved);
    if (
      !parsed ||
      typeof parsed.vehicle?.name !== "string" ||
      !VEHICLE_TYPES.includes(parsed.vehicle.type) ||
      !Number.isSafeInteger(parsed.odometer) ||
      parsed.odometer < 0 ||
      !Array.isArray(parsed.services) ||
      !parsed.services.length ||
      !Array.isArray(parsed.history)
    ) {
      throw new Error("Format data perawatan tidak valid.");
    }
    if (!isValidOdometerLog(parsed.odometerLog, parsed.odometer)) {
      if (parsed.odometerLog !== undefined) console.error("Riwayat odometer tidak valid; estimasi tanggal dimulai ulang.");
      parsed.odometerLog = [{ odometer: parsed.odometer, date: new Date().toISOString() }];
      needsOdometerLogMigration = true;
    }
    if (typeof parsed.remindersEnabled !== "boolean") parsed.remindersEnabled = false;
    if (!Array.isArray(parsed.notifiedReminders) || parsed.notifiedReminders.some(key => typeof key !== "string")) {
      parsed.notifiedReminders = [];
    }
    return parsed;
  } catch (error) {
    console.error("Gagal membaca data perawatan:", error);
    return emptyState();
  }
}

let state = loadState();
const setupScreen = document.querySelector("#setup-screen");
const dashboard = document.querySelector("#dashboard");
const setupForm = document.querySelector("#setup-form");
const catalogSelect = document.querySelector("#catalog-model");
const catalogInfo = document.querySelector("#catalog-info");
const catalogTitle = document.querySelector("#catalog-title");
const catalogNote = document.querySelector("#catalog-note");
const catalogLink = document.querySelector("#catalog-link");
const motorNameInput = document.querySelector("#motor-name");
const motorTypeInput = document.querySelector("#motor-type");
const setupOdoInput = document.querySelector("#setup-odo");
const correctInitialOdoButton = document.querySelector("#correct-initial-odo-button");
const correctLastOdoButton = document.querySelector("#correct-last-odo-button");
const odometerCorrectionDialog = document.querySelector("#odometer-correction-dialog");
const odometerCorrectionForm = document.querySelector("#odometer-correction-form");
const initialOdoCorrectionInput = document.querySelector("#initial-odo-correction");
const odometerCorrectionFeedback = document.querySelector("#odometer-correction-feedback");
const typeHint = document.querySelector("#type-hint");
const setupFeedback = document.querySelector("#setup-feedback");
const vehicleName = document.querySelector("#vehicle-name");
const vehicleType = document.querySelector("#vehicle-type");
const vehicleManual = document.querySelector("#vehicle-manual");
const vehicleManualLink = document.querySelector("#vehicle-manual-link");
const overviewScreen = document.querySelector("#overview-screen");
const activityScreen = document.querySelector("#activity-screen");
const overviewTab = document.querySelector("#overview-tab");
const activityTab = document.querySelector("#activity-tab");
const activityCount = document.querySelector("#activity-count");
const currentOdo = document.querySelector("#current-odo");
const odoInput = document.querySelector("#odo-input");
const odoFeedback = document.querySelector("#odo-feedback");
const nextCard = document.querySelector("#next-service-card");
const nextStatus = document.querySelector("#next-status");
const serviceList = document.querySelector("#service-list");
const serviceDialog = document.querySelector("#service-dialog");
const serviceForm = document.querySelector("#service-form");
const serviceNameInput = document.querySelector("#service-name");
const serviceNameField = document.querySelector("#service-name-field");
const serviceIntervalInput = document.querySelector("#service-interval");
const serviceLastAtField = document.querySelector("#service-last-at-field");
const serviceLastAtInput = document.querySelector("#service-last-at");
const dialogTitle = document.querySelector("#dialog-title");
const dialogCopy = document.querySelector("#dialog-copy");
const dialogFeedback = document.querySelector("#dialog-feedback");
const deleteServiceButton = document.querySelector("#delete-service-button");
const historyList = document.querySelector("#history-list");
const historyDialog = document.querySelector("#history-dialog");
const historyForm = document.querySelector("#history-form");
const historyNameInput = document.querySelector("#history-name-input");
const historyOdoInput = document.querySelector("#history-odo-input");
const historyDateInput = document.querySelector("#history-date-input");
const historyDialogFeedback = document.querySelector("#history-dialog-feedback");
const deleteHistoryButton = document.querySelector("#delete-history-button");
const cancelHistoryButton = document.querySelector("#cancel-history-button");
let editingHistoryIndex = null;
const partsDialog = document.querySelector("#parts-dialog");
const partsVisibilityList = document.querySelector("#parts-visibility-list");
const partsFeedback = document.querySelector("#parts-feedback");
const dataSettingsButton = document.querySelector("#data-settings-button");
const dataDialog = document.querySelector("#data-dialog");
const dataDialogFeedback = document.querySelector("#data-dialog-feedback");
const dataAppVersion = document.querySelector("#data-app-version");
const exportDataButton = document.querySelector("#export-data-button");
const importDataButton = document.querySelector("#import-data-button");
const importDataInput = document.querySelector("#import-data-input");
const resetVehicleButton = document.querySelector("#reset-vehicle-button");
const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const toast = document.querySelector("#toast");
const reminderButton = document.querySelector("#reminder-button");
const reminderCopy = document.querySelector("#reminder-copy");
const sourceWarning = document.querySelector("#vehicle-manual .source-warning");
const footerNoteCopy = document.querySelector("#footer-note-copy");
let toastTimer;
let editingServiceId = null;
let vehicleCatalog = [];

dataAppVersion.textContent = APP_VERSION;

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Gagal menyimpan data perawatan:", error);
    showToast("Data belum tersimpan. Periksa ruang penyimpanan browser.");
    return false;
  }
  return true;
}

function formatKm(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function getServiceStatus(service) {
  const dueAt = service.lastAt + service.interval;
  const remaining = dueAt - state.odometer;
  const used = Math.max(0, Math.min(100, ((state.odometer - service.lastAt) / service.interval) * 100));
  return { dueAt, remaining, used };
}

function getAverageDailyKm() {
  const log = state.odometerLog;
  if (!Array.isArray(log) || log.length < 2) return null;
  const first = log[0];
  const last = log[log.length - 1];
  const elapsedDays = (Date.parse(last.date) - Date.parse(first.date)) / 86400000;
  if (elapsedDays < 7) return null;
  const average = (last.odometer - first.odometer) / elapsedDays;
  return Number.isFinite(average) && average > 0 ? average : null;
}

function getEstimatedServiceDate(remaining) {
  if (remaining <= 0) return null;
  const average = getAverageDailyKm();
  if (!average) return null;
  const days = Math.ceil(remaining / average);
  if (!Number.isSafeInteger(days)) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

function getServiceLastDate(service) {
  return state.history.find(item => item.id === service.id)?.date || service.lastDate;
}

function formatServiceLastChanged(service) {
  const lastDate = getServiceLastDate(service);
  if (!lastDate) return `Terakhir ${formatKm(service.lastAt)} km`;
  const date = new Date(lastDate);
  if (Number.isNaN(date.getTime())) return `Terakhir ${formatKm(service.lastAt)} km`;
  return `Terakhir ${formatKm(service.lastAt)} km · ${formatDate(date)}`;
}

function getVisibleServices() {
  return state.services.filter(service => service.visible !== false);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderNextService() {
  const sorted = getVisibleServices()
    .map(service => ({ service, ...getServiceStatus(service) }))
    .sort((a, b) => a.remaining - b.remaining);
  const next = sorted[0];
  nextCard.replaceChildren();
  nextStatus.hidden = !next;
  nextCard.classList.toggle("service-feature-empty", !next);
  if (!next) {
    nextCard.append(createElement("p", "service-empty-copy", "Belum ada part yang ditampilkan."));
    const manageButton = createElement("button", "button button-light", "Pilih part");
    manageButton.type = "button";
    manageButton.addEventListener("click", openPartsDialog);
    nextCard.append(manageButton);
    return;
  }

  const top = createElement("div", "service-feature-top");
  top.append(createElement("span", "service-icon", next.service.icon));
  const copy = createElement("div");
  copy.append(createElement("p", "service-title", next.service.name));
  copy.append(createElement("p", "service-subtitle", next.service.repeatInterval
    ? `Servis pertama ${formatKm(next.service.interval)} km`
    : `Setiap ${formatKm(next.service.interval)} km`));
  top.append(copy);
  const due = createElement("span", "due-number", next.remaining <= 0 ? `${formatKm(Math.abs(next.remaining))} km lewat` : `${formatKm(next.remaining)} km lagi`);
  top.append(due);
  nextCard.append(top);

  const track = createElement("div", "progress-track");
  const fill = createElement("div", "progress-fill");
  fill.style.width = `${next.used}%`;
  track.append(fill);
  nextCard.append(track);
  const caption = createElement("div", "progress-caption");
  caption.append(createElement("span", "", formatServiceLastChanged(next.service)));
  caption.append(createElement("span", "", `Jadwal ${formatKm(next.dueAt)} km`));
  nextCard.append(caption);
  const estimatedDate = getEstimatedServiceDate(next.remaining);
  const estimateCopy = next.remaining <= 0
    ? "Jadwal sudah lewat; sebaiknya servis sekarang."
    : estimatedDate
      ? `Perkiraan tanggal: ${formatDate(estimatedDate)}`
      : "Perkiraan muncul setelah catatan odometer berjarak minimal 7 hari.";
  nextCard.append(createElement("p", "service-date-estimate", estimateCopy));

  const late = next.remaining <= 0;
  nextStatus.textContent = late ? "Lewat jadwal" : next.remaining <= 300 ? "Segera" : "Terpantau";
  nextStatus.classList.toggle("late", late);
}

function renderServices() {
  serviceList.replaceChildren();
  const visibleServices = getVisibleServices();
  document.querySelector("#item-count").textContent = `${visibleServices.length} tampil`;

  if (!visibleServices.length) {
    serviceList.append(createElement("p", "empty-services", "Part yang disembunyikan tetap bisa ditampilkan lagi."));
    return;
  }

  visibleServices
    .map(service => ({ service, ...getServiceStatus(service) }))
    .sort((a, b) => a.remaining - b.remaining)
    .forEach(({ service, dueAt, remaining, used }) => {
      const row = createElement("article", "service-row");
      const top = createElement("div", "service-row-top");
      top.append(createElement("span", "row-icon", service.icon));
      const copy = createElement("div", "row-copy");
      copy.append(createElement("p", "row-title", service.name));
      const intervalLabel = service.repeatInterval
        ? `Servis pertama ${formatKm(service.interval)} km`
        : `tiap ${formatKm(service.interval)} km`;
      const intervalNote = service.manualInterval === false ? " · interval diubah" : "";
      copy.append(createElement("p", "row-meta", `${formatServiceLastChanged(service)} · ${intervalLabel}${intervalNote}`));
      const estimatedDate = getEstimatedServiceDate(remaining);
      if (estimatedDate) copy.append(createElement("p", "row-estimate", `Perkiraan ${formatDate(estimatedDate)}`));
      top.append(copy);

      const dueClass = remaining <= 0 ? "row-due overdue" : remaining <= 300 ? "row-due warning" : "row-due";
      const due = createElement("span", dueClass, remaining <= 0 ? `${formatKm(Math.abs(remaining))} km lewat` : `${formatKm(remaining)} km lagi`);
      due.title = `Jadwal servis di ${formatKm(dueAt)} km`;
      top.append(due);
      row.append(top);

      const percent = Math.round(used);
      const progressRow = createElement("div", "service-progress-row");
      const progress = createElement("div", `progress-track service-row-progress${remaining <= 0 ? " overdue" : remaining <= 300 ? " warning" : ""}`);
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-label", `${service.name}: ${percent}% dari interval terpakai`);
      progress.setAttribute("aria-valuemin", "0");
      progress.setAttribute("aria-valuemax", "100");
      progress.setAttribute("aria-valuenow", String(percent));
      const fill = createElement("div", "progress-fill");
      fill.style.width = `${used}%`;
      progress.append(fill);
      progressRow.append(progress, createElement("span", "service-progress-percent", `${percent}%`));
      row.append(progressRow);

      const done = createElement("button", "done-button", "Ganti");
      done.type = "button";
      done.setAttribute("aria-label", `Catat penggantian ${service.name} di odometer ${formatKm(state.odometer)} kilometer`);
      done.addEventListener("click", () => markServiceDone(service.id));

      const edit = createElement("button", "edit-button", "Atur");
      edit.type = "button";
      edit.setAttribute("aria-label", `Atur interval ${service.name}`);
      edit.addEventListener("click", () => openServiceDialog(service.id));
      const actions = createElement("div", "service-row-actions");
      actions.append(done, edit);
      row.append(actions);
      serviceList.append(row);
    });
}

function renderHistory() {
  historyList.replaceChildren();
  activityCount.textContent = `${state.history.length} catatan`;
  if (!state.history.length) {
    historyList.append(createElement("p", "empty-history", "Catatan servis yang kamu buat akan muncul di sini."));
    return;
  }

  state.history.forEach((item, index) => {
    const row = createElement("div", "history-item");
    const left = createElement("div", "history-item-left");
    left.append(createElement("span", "history-check", "✓"));
    const copy = createElement("div");
    copy.append(createElement("p", "history-name", item.name));
    const date = new Date(item.date);
    const dateText = Number.isNaN(date.getTime()) ? "" : ` · ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date)}`;
    copy.append(createElement("p", "history-meta", `${formatKm(item.odometer)} km${dateText}`));
    left.append(copy);
    row.append(left);
    const editBtn = createElement("button", "history-edit-button", "Edit");
    editBtn.type = "button";
    editBtn.setAttribute("aria-label", `Edit catatan ${item.name}`);
    editBtn.addEventListener("click", () => openHistoryDialog(index));
    row.append(editBtn);
    historyList.append(row);
  });
}

function getHistoryDateInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function openHistoryDialog(index) {
  const item = state.history[index];
  if (!item) return;
  editingHistoryIndex = index;
  historyNameInput.value = item.name;
  historyOdoInput.value = String(item.odometer);
  historyDateInput.value = getHistoryDateInputValue(item.date);
  historyDialogFeedback.textContent = "";
  historyDialog.showModal();
  historyNameInput.focus();
}

cancelHistoryButton.addEventListener("click", () => historyDialog.close());

historyForm.addEventListener("submit", event => {
  event.preventDefault();
  const index = editingHistoryIndex;
  const item = state.history[index];
  const name = historyNameInput.value.trim();
  const odometer = Number(historyOdoInput.value);
  const date = new Date(`${historyDateInput.value}T12:00:00`);
  if (!item || !name || name.length > 40 || !Number.isSafeInteger(odometer) || odometer < 0 || odometer > state.odometer || Number.isNaN(date.getTime())) {
    historyDialogFeedback.textContent = `Isi nama, tanggal, dan odometer 0–${formatKm(state.odometer)} km dengan benar.`;
    return;
  }

  const previous = { ...item };
  item.name = name;
  item.odometer = odometer;
  item.date = date.toISOString();
  if (!saveState()) {
    Object.assign(item, previous);
    return;
  }
  historyDialog.close();
  render();
  showToast("Catatan servis berhasil diperbarui.");
});

deleteHistoryButton.addEventListener("click", () => {
  const index = editingHistoryIndex;
  const item = state.history[index];
  if (!item || !window.confirm(`Hapus catatan ${item.name}? Jadwal part tidak akan diubah.`)) return;

  state.history.splice(index, 1);
  if (!saveState()) {
    state.history.splice(index, 0, item);
    return;
  }
  historyDialog.close();
  render();
  showToast("Catatan servis dihapus.");
});

function renderReminderSetting() {
  if (!("Notification" in window)) {
    reminderButton.disabled = true;
    reminderButton.textContent = "Tidak tersedia";
    reminderCopy.textContent = "Browser ini belum mendukung notifikasi servis.";
    return;
  }
  if (Notification.permission === "denied") {
    reminderButton.disabled = true;
    reminderButton.textContent = "Diblokir";
    reminderCopy.textContent = "Izin notifikasi diblokir di pengaturan browser.";
    return;
  }
  reminderButton.disabled = false;
  if (state.remindersEnabled && Notification.permission === "granted") {
    reminderButton.textContent = "Matikan";
    reminderCopy.textContent = "Pengingat aktif saat Roda dibuka atau odometer diperbarui.";
  } else {
    reminderButton.textContent = "Aktifkan";
    reminderCopy.textContent = "Notifikasi muncul saat Roda dibuka atau odometer diperbarui, bukan saat aplikasi tertutup.";
  }
}

async function sendBrowserNotification(title, options) {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return;
    }
  }
  new Notification(title, options);
}

function checkServiceReminders() {
  if (!state.vehicle || !state.remindersEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
  getVisibleServices().forEach(service => {
    const { dueAt, remaining } = getServiceStatus(service);
    const level = remaining <= 0 ? "overdue" : remaining <= 300 ? "soon" : null;
    if (!level) return;
    const key = `${service.id}:${dueAt}:${level}`;
    if (state.notifiedReminders.includes(key)) return;

    const previousReminders = state.notifiedReminders;
    state.notifiedReminders = [...previousReminders, key].slice(-100);
    if (!saveState()) {
      state.notifiedReminders = previousReminders;
      return;
    }

    const statusText = level === "overdue" ? "sudah melewati jadwal" : `tersisa ${formatKm(remaining)} km`;
    const body = `${service.name} ${statusText}. Odometer sekarang ${formatKm(state.odometer)} km.`;
    sendBrowserNotification("Pengingat servis Roda", { body, tag: key, icon: "./icon.svg" }).catch(error => {
      console.error("Gagal menampilkan notifikasi servis:", error);
      state.notifiedReminders = state.notifiedReminders.filter(item => item !== key);
      saveState();
      showToast("Notifikasi belum bisa ditampilkan. Periksa izin browser.");
    });
  });
}

function showDashboardTab(tab) {
    const showActivity = tab === "activity";
    overviewScreen.hidden = showActivity;
    activityScreen.hidden = !showActivity;
    if (showActivity) {
      overviewTab.removeAttribute("aria-current");
      activityTab.setAttribute("aria-current", "page");
    } else {
      activityTab.removeAttribute("aria-current");
      overviewTab.setAttribute("aria-current", "page");
    }
    window.scrollTo(0, 0);
}

function render() {
  const setupComplete = Boolean(state.vehicle);
  setupScreen.hidden = setupComplete;
  dashboard.hidden = !setupComplete;
  dataSettingsButton.hidden = !setupComplete;
  if (!setupComplete) return;

  vehicleName.textContent = state.vehicle.name;
  vehicleType.textContent = getVehicleTypeLabel(state.vehicle.type);
  vehicleManual.hidden = !state.vehicle.manualUrl;
  if (state.vehicle.manualUrl) {
    vehicleManualLink.href = state.vehicle.manualUrl;
    sourceWarning.textContent = state.vehicle.scheduleVerified
      ? "Jadwal dirangkum dari manual resmi. Cocokkan tahun model dan kondisi motor."
      : "Interval bawaan masih contoh; cocokkan dengan manual model dan tahun ini.";
  }
  const hasEditedCatalogInterval = state.services.some(service => service.manualInterval === false);
  footerNoteCopy.textContent = state.vehicle.scheduleVerified
    ? hasEditedCatalogInterval
      ? "Ada interval yang kamu ubah dari manual resmi."
      : "Jadwal dirangkum dari manual resmi."
    : "Interval contoh. Cocokkan dengan buku manual motor.";
  currentOdo.textContent = formatKm(state.odometer);
  correctInitialOdoButton.hidden = !canCorrectInitialOdometer();
  correctLastOdoButton.hidden = !canCorrectLastOdometer();
  renderNextService();
  renderServices();
  renderHistory();
  renderReminderSetting();
  checkServiceReminders();
}

function getVehicleTypeLabel(type) {
  if (type === "matic") return "Matic";
  if (type === "chain") return "Non-matic";
  return "Tipe belum dipastikan";
}

function canCorrectInitialOdometer() {
  return state.odometerLog.length === 1 && state.history.length === 0;
}
function canCorrectLastOdometer() {
  return state.odometerLog.length >= 2;
}
function getLastOdometerCorrectionBlocker(value) {
  const previousOdometer = state.odometerLog[state.odometerLog.length - 2].odometer;
  if (value <= previousOdometer) return `Odometer harus lebih besar dari update sebelumnya (${formatKm(previousOdometer)} km).`;
  const historyItem = state.history.find(item => item.odometer > value);
  if (historyItem) return `Catatan ${historyItem.name} di ${formatKm(historyItem.odometer)} km melewati nilai ini. Ubah odometer catatan itu lewat tombol Edit di Riwayat, lalu koreksi lagi.`;
  const service = state.services.find(item => item.lastAt !== state.odometer && item.lastAt > value);
  if (service) return `Odometer tidak boleh lebih kecil dari servis terakhir ${service.name} di ${formatKm(service.lastAt)} km.`;
  return null;
}
function openLastOdometerCorrection() {
  if (!canCorrectLastOdometer()) return;
  const previousEntryOdometer = state.odometerLog[state.odometerLog.length - 2].odometer;
  const answer = window.prompt(`Koreksi odometer terakhir. Nilai sekarang ${formatKm(state.odometer)} km, harus lebih dari ${formatKm(previousEntryOdometer)} km. Tanggal catatan tidak berubah.`, String(state.odometer));
  if (answer === null) return;
  const text = answer.trim();
  const value = /^\d+$/.test(text) ? Number(text) : NaN;
  if (!Number.isSafeInteger(value)) {
    window.alert("Masukkan odometer berupa bilangan bulat 0 atau lebih.");
    return;
  }
  if (value === state.odometer) {
    window.alert("Angkanya sama dengan catatan saat ini.");
    return;
  }
  const blocker = getLastOdometerCorrectionBlocker(value);
  if (blocker) {
    window.alert(`Koreksi ditolak. ${blocker}`);
    return;
  }
  const oldOdometer = state.odometer;
  const previousLog = state.odometerLog;
  const movedServices = state.services.filter(service => service.lastAt > 0 && service.lastAt === oldOdometer);
  state.odometer = value;
  state.odometerLog = [...previousLog.slice(0, -1), { ...previousLog[previousLog.length - 1], odometer: value }];
  movedServices.forEach(service => { service.lastAt = value; });
  if (!saveState()) {
    state.odometer = oldOdometer;
    state.odometerLog = previousLog;
    movedServices.forEach(service => { service.lastAt = oldOdometer; });
    return;
  }
  odoFeedback.textContent = `Odometer terakhir dikoreksi ke ${formatKm(value)} km.`;
  render();
  showToast("Odometer terakhir berhasil dikoreksi.");
}

function showToast(message, action = null) {
  toast.replaceChildren(createElement("span", "toast-copy", message));
  if (action) {
    const button = createElement("button", "toast-action", action.label);
    button.type = "button";
    button.addEventListener("click", () => {
      clearTimeout(toastTimer);
      toast.classList.remove("show");
      action.run();
    }, { once: true });
    toast.append(button);
  }
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), action ? 10000 : 2600);
}

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch (error) {
    console.error("Gagal membaca preferensi tema:", error);
    return "dark";
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap");
  themeColor.content = theme === "dark" ? "#101820" : "#f4f7f2";
}

let currentTheme = getSavedTheme();
applyTheme(currentTheme);
themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
  } catch (error) {
    console.error("Gagal menyimpan preferensi tema:", error);
    showToast("Tema berubah, tapi belum tersimpan untuk kunjungan berikutnya.");
  }
});

function updateTypeHint() {
  const hints = {
    matic: "Jadwal Oli gardan dan V-belt akan ditambahkan.",
    chain: "Jadwal perawatan rantai & gir akan ditambahkan, tanpa Oli gardan atau V-belt.",
    unknown: "Untuk sementara hanya jadwal perawatan umum yang ditampilkan."
  };
  typeHint.textContent = hints[motorTypeInput.value] || "Pilih jenisnya supaya jadwal part yang muncul lebih sesuai.";
}

motorTypeInput.addEventListener("change", updateTypeHint);

function addCatalogOptions(models) {
  models.forEach(model => {
    const option = createElement("option", "", `${model.brand} ${model.model} · ${model.year}`);
    option.value = model.id;
    catalogSelect.insertBefore(option, catalogSelect.querySelector('[value="other"]'));
  });
}

function upgradeStoredCatalogSchedule() {
  const model = vehicleCatalog.find(item => item.id === state.vehicle?.id);
  if (!model?.scheduleVerified || state.vehicle.scheduleVerified || !state.services.length) return;

  const defaults = [...SERVICE_TEMPLATES.common, ...(state.vehicle.type === "matic" ? SERVICE_TEMPLATES.matic : state.vehicle.type === "chain" ? SERVICE_TEMPLATES.chain : [])];
  const previousServices = state.services;
  const previousVehicle = state.vehicle;
  const migratedServices = model.services.map(template => {
    const previous = previousServices.find(service => service.id === template.id && !service.custom);
    if (!previous) return { ...template, lastAt: state.odometer, visible: true };
    const defaultInterval = defaults.find(service => service.id === previous.id)?.interval;
    const hasValidInterval = Number.isSafeInteger(previous.interval) && previous.interval > 0;
    const keptUserInterval = hasValidInterval && (previous.interval !== defaultInterval || previous.manualInterval === false);
    const firstIntervalPending = Number.isSafeInteger(template.initialInterval) &&
      state.odometer < template.initialInterval &&
      !state.history.some(item => item.id === template.id);
    return {
      ...template,
      ...previous,
      interval: keptUserInterval ? previous.interval : firstIntervalPending ? template.initialInterval : template.interval,
      ...(firstIntervalPending ? { repeatInterval: template.interval } : {}),
      manualInterval: !keptUserInterval,
      lastAt: firstIntervalPending ? 0 : Number.isSafeInteger(previous.lastAt) ? previous.lastAt : state.odometer
    };
  });
  state.services = [...migratedServices, ...previousServices.filter(service => service.custom)];
  state.vehicle = { ...state.vehicle, ...model };
  if (!saveState()) {
    state.services = previousServices;
    state.vehicle = previousVehicle;
    return;
  }
  render();
  showToast("Jadwal motor diperbarui dari manual resmi.");
}

async function loadVehicleCatalog() {
  try {
    const response = await fetch("./vehicle-catalog.json");
    if (!response.ok) throw new Error(`Gagal memuat katalog (${response.status}).`);
    const catalog = await response.json();
    if (!Array.isArray(catalog.models) || catalog.models.some(model =>
      typeof model.id !== "string" ||
      typeof model.brand !== "string" ||
      typeof model.model !== "string" ||
      !Number.isSafeInteger(model.year) ||
      !VEHICLE_TYPES.includes(model.type) ||
      typeof model.manualSource !== "string" ||
      typeof model.manualUrl !== "string" ||
      typeof model.scheduleVerified !== "boolean" ||
      (model.scheduleVerified && (!Array.isArray(model.services) || !model.services.length || model.services.some(service =>
        !service ||
        typeof service.id !== "string" ||
        typeof service.name !== "string" ||
        typeof service.icon !== "string" ||
        !Number.isSafeInteger(service.interval) ||
        service.interval < 1 ||
        service.interval > 1000000 ||
        (service.initialInterval !== undefined && (!Number.isSafeInteger(service.initialInterval) || service.initialInterval < 1 || service.initialInterval > 1000000))
      )))
    )) {
      throw new Error("Format katalog motor tidak valid.");
    }
    vehicleCatalog = catalog.models;
    addCatalogOptions(vehicleCatalog);
    upgradeStoredCatalogSchedule();
  } catch (error) {
    console.error("Gagal memuat katalog motor:", error);
    setupFeedback.textContent = "Katalog belum bisa dimuat. Kamu tetap bisa isi data motor manual.";
  }
}

catalogSelect.addEventListener("change", () => {
  const model = vehicleCatalog.find(item => item.id === catalogSelect.value);
  if (!model) {
    catalogInfo.hidden = true;
    motorNameInput.value = "";
    motorTypeInput.disabled = false;
    motorTypeInput.value = "";
    updateTypeHint();
    return;
  }

  motorNameInput.value = `${model.brand} ${model.model} (${model.year})`;
  motorTypeInput.value = model.type;
  motorTypeInput.disabled = true;
  typeHint.textContent = "Jenis motor diisi dari katalog model.";
  catalogTitle.textContent = `${model.brand} ${model.model} · ${model.year}`;
  catalogLink.href = model.manualUrl;
  catalogLink.textContent = `Buka ${model.manualSource}`;
  catalogNote.textContent = model.scheduleVerified
    ? "Jadwal penggantian rutin dirangkum dari manual resmi. Servis pertama dihitung terpisah bila odometer masih rendah."
    : "Manual resmi tersedia, tetapi interval servis belum diverifikasi dan masih berupa contoh.";
  catalogInfo.hidden = false;
});

loadVehicleCatalog();

function openServiceDialog(serviceId = null) {
  const service = serviceId ? state.services.find(item => item.id === serviceId) : null;
  if (serviceId && !service) return;

  editingServiceId = service ? service.id : null;
  const isEditing = Boolean(service);
  const isCustom = Boolean(service?.custom);
  dialogTitle.textContent = isEditing ? "Atur jadwal part" : "Tambah part";
  dialogCopy.textContent = isEditing
    ? service.repeatInterval
      ? `Servis pertama tetap di ${formatKm(service.lastAt + service.interval)} km. Atur interval berulang setelahnya.`
      : `Sesuaikan interval dan kilometer servis terakhir (maksimal ${formatKm(state.odometer)} km).`
    : `Part baru mulai dihitung dari odometer ${formatKm(state.odometer)} km.`;
  serviceNameField.hidden = isEditing && !isCustom;
  serviceNameInput.value = isCustom ? service.name : "";
  serviceNameInput.required = !isEditing;
  serviceIntervalInput.value = isEditing ? service.repeatInterval || service.interval : "";
  const canEditLastAt = isEditing && !service.repeatInterval;
  serviceLastAtField.hidden = !canEditLastAt;
  serviceLastAtInput.required = canEditLastAt;
  if (canEditLastAt) {
    serviceLastAtInput.max = String(state.odometer);
    serviceLastAtInput.value = String(service.lastAt);
  } else {
    serviceLastAtInput.removeAttribute("max");
    serviceLastAtInput.value = "";
  }
  deleteServiceButton.hidden = !isCustom;
  dialogFeedback.textContent = "";
  serviceDialog.showModal();
  if (isEditing && !isCustom) serviceIntervalInput.focus();
  else serviceNameInput.focus();
}

function openPartsDialog() {
  partsVisibilityList.querySelectorAll(".part-toggle").forEach(label => label.remove());
  partsFeedback.textContent = "";
  state.services.forEach(service => {
    const label = createElement("label", "part-toggle");
    const name = createElement("span", "part-toggle-name", service.name);
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = service.visible !== false;
    input.setAttribute("aria-label", `Tampilkan ${service.name} di Ringkasan`);
    input.addEventListener("change", () => {
      const previousVisibility = service.visible;
      service.visible = input.checked;
      if (!saveState()) {
        service.visible = previousVisibility;
        input.checked = previousVisibility !== false;
        partsFeedback.textContent = "Perubahan belum tersimpan. Periksa ruang penyimpanan browser.";
        return;
      }
      partsFeedback.textContent = "";
      render();
    });
    label.append(name, input);
    partsVisibilityList.append(label);
  });
  partsDialog.showModal();
}

document.querySelector("#add-service-button").addEventListener("click", () => openServiceDialog());
document.querySelector("#manage-parts-button").addEventListener("click", openPartsDialog);
document.querySelector("#cancel-service-button").addEventListener("click", () => serviceDialog.close());

serviceForm.addEventListener("submit", event => {
  event.preventDefault();
  const interval = Number(serviceIntervalInput.value);
  const service = editingServiceId ? state.services.find(item => item.id === editingServiceId) : null;
  const name = service?.custom ? serviceNameInput.value.trim() : service ? service.name : serviceNameInput.value.trim();
  if (!Number.isSafeInteger(interval) || interval < 1 || interval > 1000000 || !name || name.length > 40) {
    dialogFeedback.textContent = "Isi nama part dan interval 1–1.000.000 km dengan benar.";
    return;
  }
  if (state.services.some(item => item.id !== editingServiceId && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    dialogFeedback.textContent = "Part dengan nama itu sudah ada di jadwal.";
    return;
  }

  if (service) {
    const canEditLastAt = !service.repeatInterval;
    const lastAt = canEditLastAt ? Number(serviceLastAtInput.value) : service.lastAt;
    if (canEditLastAt && (!Number.isSafeInteger(lastAt) || lastAt < 0 || lastAt > state.odometer)) {
      dialogFeedback.textContent = `Odometer servis terakhir harus antara 0 dan ${formatKm(state.odometer)} km.`;
      return;
    }
    const previous = { name: service.name, interval: service.interval, repeatInterval: service.repeatInterval, manualInterval: service.manualInterval, lastAt: service.lastAt, lastDate: service.lastDate };
    const intervalChanged = (service.repeatInterval || service.interval) !== interval;
    service.name = name;
    service.lastAt = lastAt;
    if (service.repeatInterval) service.repeatInterval = interval;
    else service.interval = interval;
    if (intervalChanged && service.manualInterval) service.manualInterval = false;
    if (!saveState()) {
      service.name = previous.name;
      service.interval = previous.interval;
      service.lastAt = previous.lastAt;
      if (previous.repeatInterval === undefined) delete service.repeatInterval;
      else service.repeatInterval = previous.repeatInterval;
      service.manualInterval = previous.manualInterval;
      return;
    }
    serviceDialog.close();
    render();
    showToast(`${service.name} berhasil diperbarui.`);
    return;
  }

  const customService = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    icon: "🔧",
    interval,
    lastAt: state.odometer,
    visible: true,
    custom: true
  };
  state.services.push(customService);
  if (!saveState()) {
    state.services.pop();
    return;
  }
  serviceDialog.close();
  render();
  showToast(`${name} ditambahkan ke jadwal.`);
});

deleteServiceButton.addEventListener("click", () => {
  const service = state.services.find(item => item.id === editingServiceId);
  if (!service?.custom || !window.confirm(`Hapus ${service.name} dari jadwal? Catatan servis sebelumnya tetap disimpan.`)) return;

  const previousServices = state.services;
  state.services = state.services.filter(item => item.id !== service.id);
  if (!saveState()) {
    state.services = previousServices;
    return;
  }
  serviceDialog.close();
  render();
  showToast(`${service.name} dihapus dari jadwal.`);
});

setupForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = motorNameInput.value.trim();
  const type = motorTypeInput.value;
  const odometer = Number(setupOdoInput.value);
  if (!name || name.length > 40 || !VEHICLE_TYPES.includes(type) || !Number.isSafeInteger(odometer) || odometer < 0) {
    setupFeedback.textContent = "Isi nama, jenis motor, dan odometer dengan benar.";
    return;
  }

  const previous = state;
  const now = new Date().toISOString();
  const catalogModel = vehicleCatalog.find(model => model.id === catalogSelect.value);
  state = {
    vehicle: {
      name,
      type,
      ...(catalogModel || {})
    },
    odometer,
    odometerLog: [{ odometer, date: now }],
    services: createServices(type, odometer, catalogModel),
    history: [],
    remindersEnabled: false,
    notifiedReminders: []
  };
  if (!saveState()) {
    state = previous;
    return;
  }
  render();
  showToast("Data motor berhasil disimpan.");
});

document.querySelector("#odo-form").addEventListener("submit", event => {
  event.preventDefault();
  const value = Number(odoInput.value);
  if (!Number.isSafeInteger(value) || value < state.odometer) {
    odoFeedback.textContent = "Angka harus valid dan tidak boleh lebih kecil dari odometer saat ini.";
    odoInput.setAttribute("aria-invalid", "true");
    return;
  }
  if (value === state.odometer) {
    odoFeedback.textContent = "Odometer masih sama dengan catatan terakhir.";
    odoInput.setAttribute("aria-invalid", "true");
    return;
  }

  const previous = state.odometer;
  const previousLog = state.odometerLog;
  state.odometer = value;
  state.odometerLog = [...previousLog, { odometer: value, date: new Date().toISOString() }];
  if (!saveState()) {
    state.odometer = previous;
    state.odometerLog = previousLog;
    return;
  }
  odoInput.value = "";
  odoInput.removeAttribute("aria-invalid");
  odoFeedback.textContent = `Odometer diperbarui ke ${formatKm(value)} km.`;
  render();
  showToast("Odometer berhasil diperbarui.");
});

correctLastOdoButton.addEventListener("click", openLastOdometerCorrection);
correctInitialOdoButton.addEventListener("click", () => {
  if (!canCorrectInitialOdometer()) return;
  initialOdoCorrectionInput.value = String(state.odometer);
  odometerCorrectionFeedback.textContent = "";
  odometerCorrectionDialog.showModal();
  initialOdoCorrectionInput.focus();
});

document.querySelector("#cancel-odometer-correction").addEventListener("click", () => odometerCorrectionDialog.close());

odometerCorrectionForm.addEventListener("submit", event => {
  event.preventDefault();
  const correctedOdometer = Number(initialOdoCorrectionInput.value);
  if (!canCorrectInitialOdometer()) {
    odometerCorrectionFeedback.textContent = "Koreksi awal sudah tidak tersedia setelah ada catatan km atau servis.";
    return;
  }
  if (!Number.isSafeInteger(correctedOdometer) || correctedOdometer < 0) {
    odometerCorrectionFeedback.textContent = "Masukkan odometer berupa bilangan bulat 0 atau lebih.";
    return;
  }
  if (correctedOdometer === state.odometer) {
    odometerCorrectionFeedback.textContent = "Angkanya sama dengan catatan saat ini.";
    return;
  }

  const previousOdometer = state.odometer;
  const previousLog = state.odometerLog;
  const previousServices = state.services.map(service => ({
    service,
    lastAt: service.lastAt,
    interval: service.interval,
    repeatInterval: service.repeatInterval
  }));
  state.odometer = correctedOdometer;
  state.odometerLog = [{ ...previousLog[0], odometer: correctedOdometer }];
  state.services.forEach(service => {
    if (Number.isSafeInteger(service.initialInterval)) {
      if (correctedOdometer < service.initialInterval) {
        const repeatInterval = service.repeatInterval || service.interval;
        service.lastAt = 0;
        service.interval = service.initialInterval;
        service.repeatInterval = repeatInterval;
        return;
      }
      if (service.repeatInterval) {
        service.lastAt = correctedOdometer;
        service.interval = service.repeatInterval;
        delete service.repeatInterval;
        return;
      }
    }
    if (service.lastAt === previousOdometer) service.lastAt = correctedOdometer;
  });
  if (!saveState()) {
    state.odometer = previousOdometer;
    state.odometerLog = previousLog;
    previousServices.forEach(previous => {
      previous.service.lastAt = previous.lastAt;
      previous.service.interval = previous.interval;
      if (previous.repeatInterval === undefined) delete previous.service.repeatInterval;
      else previous.service.repeatInterval = previous.repeatInterval;
    });
    odometerCorrectionFeedback.textContent = "Koreksi belum tersimpan. Periksa ruang penyimpanan browser.";
    return;
  }
  odometerCorrectionDialog.close();
  odoFeedback.textContent = `Odometer awal dikoreksi ke ${formatKm(correctedOdometer)} km.`;
  render();
  showToast("Odometer awal dan jadwal servis berhasil dikoreksi.");
});

function markServiceDone(id) {
  const service = state.services.find(item => item.id === id);
  if (!service) return;
  if (!window.confirm(`Catat ${service.name} sudah diganti pada odometer ${formatKm(state.odometer)} km?`)) return;
  const previousLastAt = service.lastAt;
  const previousLastDate = service.lastDate;
  const previousInterval = service.interval;
  const previousRepeatInterval = service.repeatInterval;
  const historyEntry = { id, name: service.name, odometer: state.odometer, date: new Date().toISOString() };
  service.lastAt = state.odometer;
  service.lastDate = historyEntry.date;
  if (service.repeatInterval) {
    service.interval = service.repeatInterval;
    delete service.repeatInterval;
  }
  state.history.unshift(historyEntry);
  if (!saveState()) {
    service.lastAt = previousLastAt;
    service.lastDate = previousLastDate;
    service.interval = previousInterval;
    if (previousRepeatInterval === undefined) delete service.repeatInterval;
    else service.repeatInterval = previousRepeatInterval;
    const historyIndex = state.history.indexOf(historyEntry);
    if (historyIndex >= 0) state.history.splice(historyIndex, 1);
    return;
  }
  render();
  showToast(`${service.name} sudah diganti. Jadwal berikutnya mulai dari ${formatKm(state.odometer)} km.`, {
    label: "Urungkan",
    run: () => undoServiceDone(service, previousLastAt, previousLastDate, previousInterval, previousRepeatInterval, historyEntry)
  });
}

function undoServiceDone(service, previousLastAt, previousLastDate, previousInterval, previousRepeatInterval, historyEntry) {
  const historyIndex = state.history.indexOf(historyEntry);
  if (!state.services.includes(service) || historyIndex < 0) return;
  const currentLastAt = service.lastAt;
  const currentLastDate = service.lastDate;
  const currentInterval = service.interval;
  const currentRepeatInterval = service.repeatInterval;
  service.lastAt = previousLastAt;
  if (previousLastDate === undefined) delete service.lastDate;
  else service.lastDate = previousLastDate;
  service.interval = previousInterval;
  if (previousRepeatInterval === undefined) delete service.repeatInterval;
  else service.repeatInterval = previousRepeatInterval;
  state.history.splice(historyIndex, 1);
  if (!saveState()) {
    service.lastAt = currentLastAt;
    if (currentLastDate === undefined) delete service.lastDate;
    else service.lastDate = currentLastDate;
    service.interval = currentInterval;
    if (currentRepeatInterval === undefined) delete service.repeatInterval;
    else service.repeatInterval = currentRepeatInterval;
    state.history.splice(historyIndex, 0, historyEntry);
    return;
  }
  render();
  showToast(`${service.name} dikembalikan ke jadwal sebelumnya.`);
}

reminderButton.addEventListener("click", async () => {
  if (!("Notification" in window)) return;
  if (state.remindersEnabled && Notification.permission === "granted") {
    state.remindersEnabled = false;
    if (!saveState()) {
      state.remindersEnabled = true;
      return;
    }
    renderReminderSetting();
    showToast("Pengingat servis dimatikan.");
    return;
  }

  try {
    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
    if (permission !== "granted") {
      renderReminderSetting();
      showToast(permission === "denied"
        ? "Izin notifikasi diblokir di browser."
        : "Izin notifikasi belum diberikan.");
      return;
    }
    state.remindersEnabled = true;
    if (!saveState()) {
      state.remindersEnabled = false;
      return;
    }
    render();
    showToast("Pengingat servis berhasil diaktifkan.");
  } catch (error) {
    console.error("Gagal meminta izin notifikasi:", error);
    showToast("Izin notifikasi belum bisa diminta. Periksa pengaturan browser.");
  }
});

function parseImportedState(rawText) {
  const parsed = JSON.parse(rawText);
  const candidate = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
  if (
    !candidate ||
    typeof candidate.vehicle?.name !== "string" ||
    !candidate.vehicle.name.trim() ||
    candidate.vehicle.name.trim().length > 40 ||
    !VEHICLE_TYPES.includes(candidate.vehicle.type) ||
    !Number.isSafeInteger(candidate.odometer) ||
    candidate.odometer < 0 ||
    !Array.isArray(candidate.services) ||
    !candidate.services.length ||
    candidate.services.some(service =>
      !service ||
      typeof service.id !== "string" ||
      typeof service.name !== "string" ||
      !service.name.trim() ||
      typeof service.icon !== "string" ||
      !Number.isSafeInteger(service.interval) ||
      service.interval < 1 ||
      service.interval > 1000000 ||
      !Number.isSafeInteger(service.lastAt) ||
      service.lastAt < 0 ||
      service.lastAt > candidate.odometer ||
      (service.repeatInterval !== undefined && (!Number.isSafeInteger(service.repeatInterval) || service.repeatInterval < 1 || service.repeatInterval > 1000000))
    ) ||
    !Array.isArray(candidate.history) ||
    candidate.history.some(item =>
      !item ||
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      !Number.isSafeInteger(item.odometer) ||
      item.odometer < 0 ||
      typeof item.date !== "string" ||
      !Number.isFinite(Date.parse(item.date))
    )
  ) {
    throw new Error("Struktur file cadangan tidak valid.");
  }

  const vehicle = { ...candidate.vehicle, name: candidate.vehicle.name.trim() };
  const odometerLog = isValidOdometerLog(candidate.odometerLog, candidate.odometer)
    ? candidate.odometerLog
    : [{ odometer: candidate.odometer, date: new Date().toISOString() }];
  return {
    vehicle,
    odometer: candidate.odometer,
    odometerLog,
    services: candidate.services.map(service => ({ ...service, name: service.name.trim(), visible: service.visible !== false })),
    history: candidate.history,
    remindersEnabled: typeof candidate.remindersEnabled === "boolean" ? candidate.remindersEnabled : false,
    notifiedReminders: Array.isArray(candidate.notifiedReminders)
      ? candidate.notifiedReminders.filter(key => typeof key === "string").slice(-100)
      : []
  };
}

dataSettingsButton.addEventListener("click", () => {
  dataDialogFeedback.textContent = "";
  dataDialog.showModal();
});

exportDataButton.addEventListener("click", () => {
  if (!state.vehicle) return;
  const slug = state.vehicle.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "motor";
  const dateStamp = new Date().toISOString().slice(0, 10);
  const payload = JSON.stringify({ app: "roda", version: 2, exportedAt: new Date().toISOString(), data: state }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `roda-backup-${slug}-${dateStamp}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  dataDialog.close();
  showToast("File cadangan JSON berhasil diunduh.");
});

importDataButton.addEventListener("click", () => {
  dataDialogFeedback.textContent = "";
  importDataInput.value = "";
  importDataInput.click();
});

importDataInput.addEventListener("change", async () => {
  const file = importDataInput.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const importedState = parseImportedState(text);
    if (!window.confirm(`Pulihkan data untuk ${importedState.vehicle.name} (${formatKm(importedState.odometer)} km)? Data saat ini akan diganti.`)) {
      importDataInput.value = "";
      return;
    }
    const previousState = state;
    state = importedState;
    if (!saveState()) {
      state = previousState;
      dataDialogFeedback.textContent = "Data gagal disimpan. Periksa ruang penyimpanan browser.";
      return;
    }
    importDataInput.value = "";
    dataDialog.close();
    showDashboardTab("overview");
    render();
    showToast("Data cadangan berhasil dipulihkan.");
  } catch (error) {
    console.error("Gagal mengimpor cadangan:", error);
    dataDialogFeedback.textContent = "File cadangan tidak valid atau rusak.";
  }
});

resetVehicleButton.addEventListener("click", () => {
  if (!state.vehicle) return;
  if (!window.confirm(`Hapus data ${state.vehicle.name} dan mulai setup ulang? Pastikan kamu sudah ekspor cadangan jika diperlukan.`)) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Gagal menghapus data motor:", error);
    dataDialogFeedback.textContent = "Gagal menghapus data dari browser.";
    return;
  }
  state = emptyState();
  setupForm.reset();
  catalogSelect.value = "";
  catalogInfo.hidden = true;
  motorTypeInput.disabled = false;
  setupFeedback.textContent = "";
  updateTypeHint();
  dataDialog.close();
  showDashboardTab("overview");
  render();
  showToast("Data motor dihapus. Silakan isi data motor baru.");
});

overviewTab.addEventListener("click", () => showDashboardTab("overview"));
activityTab.addEventListener("click", () => showDashboardTab("activity"));

if (needsOdometerLogMigration) saveState();
render();

let installPrompt;
const installButton = document.querySelector("#install-button");
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.error("Gagal mendaftarkan service worker:", error);
    });
  });
}
=======
const APP_VERSION = "1.0.0";
const STORAGE_KEY = "roda-maintenance-v2";
const THEME_STORAGE_KEY = "roda-theme";
const VEHICLE_TYPES = ["matic", "chain", "unknown"];
const SERVICE_TEMPLATES = {
  common: [
    { id: "oil", name: "Oli mesin", icon: "🛢️", interval: 2000 },
    { id: "air-filter", name: "Filter udara", icon: "🌬️", interval: 8000 },
    { id: "spark-plug", name: "Busi", icon: "⚡", interval: 8000 },
    { id: "brake-pad", name: "Kampas rem", icon: "🛑", interval: 12000 }
  ],
  matic: [
    { id: "gear-oil", name: "Oli gardan", icon: "⚙️", interval: 8000 },
    { id: "v-belt", name: "V-belt", icon: "〰️", interval: 24000 }
  ],
  chain: [
    { id: "chain", name: "Rantai & gir", icon: "🔗", interval: 1000 }
  ]
};

function emptyState() {
  return { vehicle: null, odometer: 0, odometerLog: [], services: [], history: [], remindersEnabled: false, notifiedReminders: [] };
}

function createServices(type, odometer, catalogModel) {
  const typeSpecific = type === "matic" ? SERVICE_TEMPLATES.matic : type === "chain" ? SERVICE_TEMPLATES.chain : [];
  const schedule = catalogModel?.scheduleVerified ? catalogModel.services : [...SERVICE_TEMPLATES.common, ...typeSpecific];
  return schedule.map(service => {
    const firstIntervalPending = Number.isSafeInteger(service.initialInterval) && odometer < service.initialInterval;
    return {
      ...service,
      interval: firstIntervalPending ? service.initialInterval : service.interval,
      ...(firstIntervalPending ? { repeatInterval: service.interval, lastAt: 0 } : { lastAt: odometer }),
      visible: true
    };
  });
}

function isValidOdometerLog(log, odometer) {
  if (!Array.isArray(log) || !log.length) return false;
  for (let index = 0; index < log.length; index += 1) {
    const entry = log[index];
    if (!entry || !Number.isSafeInteger(entry.odometer) || entry.odometer < 0 || typeof entry.date !== "string") return false;
    const date = Date.parse(entry.date);
    if (!Number.isFinite(date)) return false;
    if (index > 0) {
      const previous = log[index - 1];
      if (entry.odometer <= previous.odometer || date < Date.parse(previous.date)) return false;
    }
  }
  return log[log.length - 1].odometer === odometer;
}

let needsOdometerLogMigration = false;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyState();
    const parsed = JSON.parse(saved);
    if (
      !parsed ||
      typeof parsed.vehicle?.name !== "string" ||
      !VEHICLE_TYPES.includes(parsed.vehicle.type) ||
      !Number.isSafeInteger(parsed.odometer) ||
      parsed.odometer < 0 ||
      !Array.isArray(parsed.services) ||
      !parsed.services.length ||
      !Array.isArray(parsed.history)
    ) {
      throw new Error("Format data perawatan tidak valid.");
    }
    if (!isValidOdometerLog(parsed.odometerLog, parsed.odometer)) {
      if (parsed.odometerLog !== undefined) console.error("Riwayat odometer tidak valid; estimasi tanggal dimulai ulang.");
      parsed.odometerLog = [{ odometer: parsed.odometer, date: new Date().toISOString() }];
      needsOdometerLogMigration = true;
    }
    if (typeof parsed.remindersEnabled !== "boolean") parsed.remindersEnabled = false;
    if (!Array.isArray(parsed.notifiedReminders) || parsed.notifiedReminders.some(key => typeof key !== "string")) {
      parsed.notifiedReminders = [];
    }
    return parsed;
  } catch (error) {
    console.error("Gagal membaca data perawatan:", error);
    return emptyState();
  }
}

let state = loadState();
const setupScreen = document.querySelector("#setup-screen");
const dashboard = document.querySelector("#dashboard");
const setupForm = document.querySelector("#setup-form");
const catalogSelect = document.querySelector("#catalog-model");
const catalogInfo = document.querySelector("#catalog-info");
const catalogTitle = document.querySelector("#catalog-title");
const catalogNote = document.querySelector("#catalog-note");
const catalogLink = document.querySelector("#catalog-link");
const motorNameInput = document.querySelector("#motor-name");
const motorTypeInput = document.querySelector("#motor-type");
const setupOdoInput = document.querySelector("#setup-odo");
const correctInitialOdoButton = document.querySelector("#correct-initial-odo-button");
const odometerCorrectionDialog = document.querySelector("#odometer-correction-dialog");
const odometerCorrectionForm = document.querySelector("#odometer-correction-form");
const initialOdoCorrectionInput = document.querySelector("#initial-odo-correction");
const odometerCorrectionFeedback = document.querySelector("#odometer-correction-feedback");
const typeHint = document.querySelector("#type-hint");
const setupFeedback = document.querySelector("#setup-feedback");
const vehicleName = document.querySelector("#vehicle-name");
const vehicleType = document.querySelector("#vehicle-type");
const vehicleManual = document.querySelector("#vehicle-manual");
const vehicleManualLink = document.querySelector("#vehicle-manual-link");
const overviewScreen = document.querySelector("#overview-screen");
const activityScreen = document.querySelector("#activity-screen");
const overviewTab = document.querySelector("#overview-tab");
const activityTab = document.querySelector("#activity-tab");
const activityCount = document.querySelector("#activity-count");
const currentOdo = document.querySelector("#current-odo");
const odoInput = document.querySelector("#odo-input");
const odoFeedback = document.querySelector("#odo-feedback");
const nextCard = document.querySelector("#next-service-card");
const nextStatus = document.querySelector("#next-status");
const serviceList = document.querySelector("#service-list");
const serviceDialog = document.querySelector("#service-dialog");
const serviceForm = document.querySelector("#service-form");
const serviceNameInput = document.querySelector("#service-name");
const serviceNameField = document.querySelector("#service-name-field");
const serviceIntervalInput = document.querySelector("#service-interval");
const serviceLastAtField = document.querySelector("#service-last-at-field");
const serviceLastAtInput = document.querySelector("#service-last-at");
const dialogTitle = document.querySelector("#dialog-title");
const dialogCopy = document.querySelector("#dialog-copy");
const dialogFeedback = document.querySelector("#dialog-feedback");
const deleteServiceButton = document.querySelector("#delete-service-button");
const historyList = document.querySelector("#history-list");
const historyDialog = document.querySelector("#history-dialog");
const historyForm = document.querySelector("#history-form");
const historyNameInput = document.querySelector("#history-name-input");
const historyOdoInput = document.querySelector("#history-odo-input");
const historyDateInput = document.querySelector("#history-date-input");
const historyDialogFeedback = document.querySelector("#history-dialog-feedback");
const deleteHistoryButton = document.querySelector("#delete-history-button");
const cancelHistoryButton = document.querySelector("#cancel-history-button");
let editingHistoryIndex = null;
const partsDialog = document.querySelector("#parts-dialog");
const partsVisibilityList = document.querySelector("#parts-visibility-list");
const partsFeedback = document.querySelector("#parts-feedback");
const dataSettingsButton = document.querySelector("#data-settings-button");
const dataDialog = document.querySelector("#data-dialog");
const dataDialogFeedback = document.querySelector("#data-dialog-feedback");
const dataAppVersion = document.querySelector("#data-app-version");
const exportDataButton = document.querySelector("#export-data-button");
const importDataButton = document.querySelector("#import-data-button");
const importDataInput = document.querySelector("#import-data-input");
const resetVehicleButton = document.querySelector("#reset-vehicle-button");
const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const toast = document.querySelector("#toast");
const reminderButton = document.querySelector("#reminder-button");
const reminderCopy = document.querySelector("#reminder-copy");
const sourceWarning = document.querySelector("#vehicle-manual .source-warning");
const footerNoteCopy = document.querySelector("#footer-note-copy");
let toastTimer;
let editingServiceId = null;
let vehicleCatalog = [];

dataAppVersion.textContent = APP_VERSION;

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Gagal menyimpan data perawatan:", error);
    showToast("Data belum tersimpan. Periksa ruang penyimpanan browser.");
    return false;
  }
  return true;
}

function formatKm(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function getServiceStatus(service) {
  const dueAt = service.lastAt + service.interval;
  const remaining = dueAt - state.odometer;
  const used = Math.max(0, Math.min(100, ((state.odometer - service.lastAt) / service.interval) * 100));
  return { dueAt, remaining, used };
}

function getAverageDailyKm() {
  const log = state.odometerLog;
  if (!Array.isArray(log) || log.length < 2) return null;
  const first = log[0];
  const last = log[log.length - 1];
  const elapsedDays = (Date.parse(last.date) - Date.parse(first.date)) / 86400000;
  if (elapsedDays < 7) return null;
  const average = (last.odometer - first.odometer) / elapsedDays;
  return Number.isFinite(average) && average > 0 ? average : null;
}

function getEstimatedServiceDate(remaining) {
  if (remaining <= 0) return null;
  const average = getAverageDailyKm();
  if (!average) return null;
  const days = Math.ceil(remaining / average);
  if (!Number.isSafeInteger(days)) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

function getServiceLastDate(service) {
  return service.lastDate || state.history.find(item => item.id === service.id)?.date;
}

function formatServiceLastChanged(service) {
  const lastDate = getServiceLastDate(service);
  if (!lastDate) return `Terakhir ${formatKm(service.lastAt)} km`;
  const date = new Date(lastDate);
  if (Number.isNaN(date.getTime())) return `Terakhir ${formatKm(service.lastAt)} km`;
  return `Terakhir ${formatKm(service.lastAt)} km · ${formatDate(date)}`;
}

function getVisibleServices() {
  return state.services.filter(service => service.visible !== false);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderNextService() {
  const sorted = getVisibleServices()
    .map(service => ({ service, ...getServiceStatus(service) }))
    .sort((a, b) => a.remaining - b.remaining);
  const next = sorted[0];
  nextCard.replaceChildren();
  nextStatus.hidden = !next;
  nextCard.classList.toggle("service-feature-empty", !next);
  if (!next) {
    nextCard.append(createElement("p", "service-empty-copy", "Belum ada part yang ditampilkan."));
    const manageButton = createElement("button", "button button-light", "Pilih part");
    manageButton.type = "button";
    manageButton.addEventListener("click", openPartsDialog);
    nextCard.append(manageButton);
    return;
  }

  const top = createElement("div", "service-feature-top");
  top.append(createElement("span", "service-icon", next.service.icon));
  const copy = createElement("div");
  copy.append(createElement("p", "service-title", next.service.name));
  copy.append(createElement("p", "service-subtitle", next.service.repeatInterval
    ? `Servis pertama ${formatKm(next.service.interval)} km`
    : `Setiap ${formatKm(next.service.interval)} km`));
  top.append(copy);
  const due = createElement("span", "due-number", next.remaining <= 0 ? `${formatKm(Math.abs(next.remaining))} km lewat` : `${formatKm(next.remaining)} km lagi`);
  top.append(due);
  nextCard.append(top);

  const track = createElement("div", "progress-track");
  const fill = createElement("div", "progress-fill");
  fill.style.width = `${next.used}%`;
  track.append(fill);
  nextCard.append(track);
  const caption = createElement("div", "progress-caption");
  caption.append(createElement("span", "", formatServiceLastChanged(next.service)));
  caption.append(createElement("span", "", `Jadwal ${formatKm(next.dueAt)} km`));
  nextCard.append(caption);
  const estimatedDate = getEstimatedServiceDate(next.remaining);
  const estimateCopy = next.remaining <= 0
    ? "Jadwal sudah lewat; sebaiknya servis sekarang."
    : estimatedDate
      ? `Perkiraan tanggal: ${formatDate(estimatedDate)}`
      : "Perkiraan muncul setelah catatan odometer berjarak minimal 7 hari.";
  nextCard.append(createElement("p", "service-date-estimate", estimateCopy));

  const late = next.remaining <= 0;
  nextStatus.textContent = late ? "Lewat jadwal" : next.remaining <= 300 ? "Segera" : "Terpantau";
  nextStatus.classList.toggle("late", late);
}

function renderServices() {
  serviceList.replaceChildren();
  const visibleServices = getVisibleServices();
  document.querySelector("#item-count").textContent = `${visibleServices.length} tampil`;

  if (!visibleServices.length) {
    serviceList.append(createElement("p", "empty-services", "Part yang disembunyikan tetap bisa ditampilkan lagi."));
    return;
  }

  visibleServices
    .map(service => ({ service, ...getServiceStatus(service) }))
    .sort((a, b) => a.remaining - b.remaining)
    .forEach(({ service, dueAt, remaining, used }) => {
      const row = createElement("article", "service-row");
      const top = createElement("div", "service-row-top");
      top.append(createElement("span", "row-icon", service.icon));
      const copy = createElement("div", "row-copy");
      copy.append(createElement("p", "row-title", service.name));
      const intervalLabel = service.repeatInterval
        ? `Servis pertama ${formatKm(service.interval)} km`
        : `tiap ${formatKm(service.interval)} km`;
      const intervalNote = service.manualInterval === false ? " · interval diubah" : "";
      copy.append(createElement("p", "row-meta", `${formatServiceLastChanged(service)} · ${intervalLabel}${intervalNote}`));
      const estimatedDate = getEstimatedServiceDate(remaining);
      if (estimatedDate) copy.append(createElement("p", "row-estimate", `Perkiraan ${formatDate(estimatedDate)}`));
      top.append(copy);

      const dueClass = remaining <= 0 ? "row-due overdue" : remaining <= 300 ? "row-due warning" : "row-due";
      const due = createElement("span", dueClass, remaining <= 0 ? `${formatKm(Math.abs(remaining))} km lewat` : `${formatKm(remaining)} km lagi`);
      due.title = `Jadwal servis di ${formatKm(dueAt)} km`;
      top.append(due);
      row.append(top);

      const percent = Math.round(used);
      const progressRow = createElement("div", "service-progress-row");
      const progress = createElement("div", `progress-track service-row-progress${remaining <= 0 ? " overdue" : remaining <= 300 ? " warning" : ""}`);
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-label", `${service.name}: ${percent}% dari interval terpakai`);
      progress.setAttribute("aria-valuemin", "0");
      progress.setAttribute("aria-valuemax", "100");
      progress.setAttribute("aria-valuenow", String(percent));
      const fill = createElement("div", "progress-fill");
      fill.style.width = `${used}%`;
      progress.append(fill);
      progressRow.append(progress, createElement("span", "service-progress-percent", `${percent}%`));
      row.append(progressRow);

      const done = createElement("button", "done-button", "Ganti");
      done.type = "button";
      done.setAttribute("aria-label", `Catat penggantian ${service.name} di odometer ${formatKm(state.odometer)} kilometer`);
      done.addEventListener("click", () => markServiceDone(service.id));

      const edit = createElement("button", "edit-button", "Atur");
      edit.type = "button";
      edit.setAttribute("aria-label", `Atur interval ${service.name}`);
      edit.addEventListener("click", () => openServiceDialog(service.id));
      const actions = createElement("div", "service-row-actions");
      actions.append(done, edit);
      row.append(actions);
      serviceList.append(row);
    });
}

function renderHistory() {
  historyList.replaceChildren();
  activityCount.textContent = `${state.history.length} catatan`;
  if (!state.history.length) {
    historyList.append(createElement("p", "empty-history", "Catatan servis yang kamu buat akan muncul di sini."));
    return;
  }

  state.history.forEach((item, index) => {
    const row = createElement("div", "history-item");
    const left = createElement("div", "history-item-left");
    left.append(createElement("span", "history-check", "✓"));
    const copy = createElement("div");
    copy.append(createElement("p", "history-name", item.name));
    const date = new Date(item.date);
    const dateText = Number.isNaN(date.getTime()) ? "" : ` · ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date)}`;
    copy.append(createElement("p", "history-meta", `${formatKm(item.odometer)} km${dateText}`));
    left.append(copy);
    row.append(left);
    const editBtn = createElement("button", "history-edit-button", "Edit");
    editBtn.type = "button";
    editBtn.setAttribute("aria-label", `Edit catatan ${item.name}`);
    editBtn.addEventListener("click", () => openHistoryDialog(index));
    row.append(editBtn);
    historyList.append(row);
  });
}

function getHistoryDateInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function openHistoryDialog(index) {
  const item = state.history[index];
  if (!item) return;
  editingHistoryIndex = index;
  historyNameInput.value = item.name;
  historyOdoInput.value = String(item.odometer);
  historyDateInput.value = getHistoryDateInputValue(item.date);
  historyDialogFeedback.textContent = "";
  historyDialog.showModal();
  historyNameInput.focus();
}

cancelHistoryButton.addEventListener("click", () => historyDialog.close());

historyForm.addEventListener("submit", event => {
  event.preventDefault();
  const index = editingHistoryIndex;
  const item = state.history[index];
  const name = historyNameInput.value.trim();
  const odometer = Number(historyOdoInput.value);
  const date = new Date(`${historyDateInput.value}T12:00:00`);
  if (!item || !name || name.length > 40 || !Number.isSafeInteger(odometer) || odometer < 0 || odometer > state.odometer || Number.isNaN(date.getTime())) {
    historyDialogFeedback.textContent = `Isi nama, tanggal, dan odometer 0–${formatKm(state.odometer)} km dengan benar.`;
    return;
  }

  const previous = { ...item };
  item.name = name;
  item.odometer = odometer;
  item.date = date.toISOString();
  if (!saveState()) {
    Object.assign(item, previous);
    return;
  }
  historyDialog.close();
  render();
  showToast("Catatan servis berhasil diperbarui.");
});

deleteHistoryButton.addEventListener("click", () => {
  const index = editingHistoryIndex;
  const item = state.history[index];
  if (!item || !window.confirm(`Hapus catatan ${item.name}? Jadwal part tidak akan diubah.`)) return;

  state.history.splice(index, 1);
  if (!saveState()) {
    state.history.splice(index, 0, item);
    return;
  }
  historyDialog.close();
  render();
  showToast("Catatan servis dihapus.");
});

function renderReminderSetting() {
  if (!("Notification" in window)) {
    reminderButton.disabled = true;
    reminderButton.textContent = "Tidak tersedia";
    reminderCopy.textContent = "Browser ini belum mendukung notifikasi servis.";
    return;
  }
  if (Notification.permission === "denied") {
    reminderButton.disabled = true;
    reminderButton.textContent = "Diblokir";
    reminderCopy.textContent = "Izin notifikasi diblokir di pengaturan browser.";
    return;
  }
  reminderButton.disabled = false;
  if (state.remindersEnabled && Notification.permission === "granted") {
    reminderButton.textContent = "Matikan";
    reminderCopy.textContent = "Pengingat aktif saat Roda dibuka atau odometer diperbarui.";
  } else {
    reminderButton.textContent = "Aktifkan";
    reminderCopy.textContent = "Notifikasi muncul saat Roda dibuka atau odometer diperbarui, bukan saat aplikasi tertutup.";
  }
}

async function sendBrowserNotification(title, options) {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return;
    }
  }
  new Notification(title, options);
}

function checkServiceReminders() {
  if (!state.vehicle || !state.remindersEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
  state.services.forEach(service => {
    const { dueAt, remaining } = getServiceStatus(service);
    const level = remaining <= 0 ? "overdue" : remaining <= 300 ? "soon" : null;
    if (!level) return;
    const key = `${service.id}:${dueAt}:${level}`;
    if (state.notifiedReminders.includes(key)) return;

    const previousReminders = state.notifiedReminders;
    state.notifiedReminders = [...previousReminders, key].slice(-100);
    if (!saveState()) {
      state.notifiedReminders = previousReminders;
      return;
    }

    const statusText = level === "overdue" ? "sudah melewati jadwal" : `tersisa ${formatKm(remaining)} km`;
    const body = `${service.name} ${statusText}. Odometer sekarang ${formatKm(state.odometer)} km.`;
    sendBrowserNotification("Pengingat servis Roda", { body, tag: key, icon: "./icon.svg" }).catch(error => {
      console.error("Gagal menampilkan notifikasi servis:", error);
      state.notifiedReminders = state.notifiedReminders.filter(item => item !== key);
      saveState();
      showToast("Notifikasi belum bisa ditampilkan. Periksa izin browser.");
    });
  });
}

function showDashboardTab(tab) {
    const showActivity = tab === "activity";
    overviewScreen.hidden = showActivity;
    activityScreen.hidden = !showActivity;
    if (showActivity) {
      overviewTab.removeAttribute("aria-current");
      activityTab.setAttribute("aria-current", "page");
    } else {
      activityTab.removeAttribute("aria-current");
      overviewTab.setAttribute("aria-current", "page");
    }
    window.scrollTo(0, 0);
}

function render() {
  const setupComplete = Boolean(state.vehicle);
  setupScreen.hidden = setupComplete;
  dashboard.hidden = !setupComplete;
  dataSettingsButton.hidden = !setupComplete;
  if (!setupComplete) return;

  vehicleName.textContent = state.vehicle.name;
  vehicleType.textContent = getVehicleTypeLabel(state.vehicle.type);
  vehicleManual.hidden = !state.vehicle.manualUrl;
  if (state.vehicle.manualUrl) {
    vehicleManualLink.href = state.vehicle.manualUrl;
    sourceWarning.textContent = state.vehicle.scheduleVerified
      ? "Jadwal dirangkum dari manual resmi. Cocokkan tahun model dan kondisi motor."
      : "Interval bawaan masih contoh; cocokkan dengan manual model dan tahun ini.";
  }
  const hasEditedCatalogInterval = state.services.some(service => service.manualInterval === false);
  footerNoteCopy.textContent = state.vehicle.scheduleVerified
    ? hasEditedCatalogInterval
      ? "Ada interval yang kamu ubah dari manual resmi."
      : "Jadwal dirangkum dari manual resmi."
    : "Interval contoh. Cocokkan dengan buku manual motor.";
  currentOdo.textContent = formatKm(state.odometer);
  correctInitialOdoButton.hidden = !canCorrectInitialOdometer();
  renderNextService();
  renderServices();
  renderHistory();
  renderReminderSetting();
  checkServiceReminders();
}

function getVehicleTypeLabel(type) {
  if (type === "matic") return "Matic";
  if (type === "chain") return "Non-matic";
  return "Tipe belum dipastikan";
}

function canCorrectInitialOdometer() {
  return state.odometerLog.length === 1 && state.history.length === 0;
}

function showToast(message, action = null) {
  toast.replaceChildren(createElement("span", "toast-copy", message));
  if (action) {
    const button = createElement("button", "toast-action", action.label);
    button.type = "button";
    button.addEventListener("click", () => {
      clearTimeout(toastTimer);
      toast.classList.remove("show");
      action.run();
    }, { once: true });
    toast.append(button);
  }
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), action ? 10000 : 2600);
}

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch (error) {
    console.error("Gagal membaca preferensi tema:", error);
    return "dark";
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap");
  themeColor.content = theme === "dark" ? "#101820" : "#f4f7f2";
}

let currentTheme = getSavedTheme();
applyTheme(currentTheme);
themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
  } catch (error) {
    console.error("Gagal menyimpan preferensi tema:", error);
    showToast("Tema berubah, tapi belum tersimpan untuk kunjungan berikutnya.");
  }
});

function updateTypeHint() {
  const hints = {
    matic: "Jadwal Oli gardan dan V-belt akan ditambahkan.",
    chain: "Jadwal perawatan rantai & gir akan ditambahkan, tanpa Oli gardan atau V-belt.",
    unknown: "Untuk sementara hanya jadwal perawatan umum yang ditampilkan."
  };
  typeHint.textContent = hints[motorTypeInput.value] || "Pilih jenisnya supaya jadwal part yang muncul lebih sesuai.";
}

motorTypeInput.addEventListener("change", updateTypeHint);

function addCatalogOptions(models) {
  models.forEach(model => {
    const option = createElement("option", "", `${model.brand} ${model.model} · ${model.year}`);
    option.value = model.id;
    catalogSelect.insertBefore(option, catalogSelect.querySelector('[value="other"]'));
  });
}

function upgradeStoredCatalogSchedule() {
  const model = vehicleCatalog.find(item => item.id === state.vehicle?.id);
  if (!model?.scheduleVerified || state.vehicle.scheduleVerified || !state.services.length) return;

  const defaults = [...SERVICE_TEMPLATES.common, ...(state.vehicle.type === "matic" ? SERVICE_TEMPLATES.matic : state.vehicle.type === "chain" ? SERVICE_TEMPLATES.chain : [])];
  const previousServices = state.services;
  const previousVehicle = state.vehicle;
  const migratedServices = model.services.map(template => {
    const previous = previousServices.find(service => service.id === template.id && !service.custom);
    if (!previous) return { ...template, lastAt: state.odometer, visible: true };
    const defaultInterval = defaults.find(service => service.id === previous.id)?.interval;
    const hasValidInterval = Number.isSafeInteger(previous.interval) && previous.interval > 0;
    const keptUserInterval = hasValidInterval && (previous.interval !== defaultInterval || previous.manualInterval === false);
    const firstIntervalPending = Number.isSafeInteger(template.initialInterval) &&
      state.odometer < template.initialInterval &&
      !state.history.some(item => item.id === template.id);
    return {
      ...template,
      ...previous,
      interval: keptUserInterval ? previous.interval : firstIntervalPending ? template.initialInterval : template.interval,
      ...(firstIntervalPending ? { repeatInterval: template.interval } : {}),
      manualInterval: !keptUserInterval,
      lastAt: firstIntervalPending ? 0 : Number.isSafeInteger(previous.lastAt) ? previous.lastAt : state.odometer
    };
  });
  state.services = [...migratedServices, ...previousServices.filter(service => service.custom)];
  state.vehicle = { ...state.vehicle, ...model };
  if (!saveState()) {
    state.services = previousServices;
    state.vehicle = previousVehicle;
    return;
  }
  render();
  showToast("Jadwal motor diperbarui dari manual resmi.");
}

async function loadVehicleCatalog() {
  try {
    const response = await fetch("./vehicle-catalog.json");
    if (!response.ok) throw new Error(`Gagal memuat katalog (${response.status}).`);
    const catalog = await response.json();
    if (!Array.isArray(catalog.models) || catalog.models.some(model =>
      typeof model.id !== "string" ||
      typeof model.brand !== "string" ||
      typeof model.model !== "string" ||
      !Number.isSafeInteger(model.year) ||
      !VEHICLE_TYPES.includes(model.type) ||
      typeof model.manualSource !== "string" ||
      typeof model.manualUrl !== "string" ||
      typeof model.scheduleVerified !== "boolean" ||
      (model.scheduleVerified && (!Array.isArray(model.services) || !model.services.length || model.services.some(service =>
        !service ||
        typeof service.id !== "string" ||
        typeof service.name !== "string" ||
        typeof service.icon !== "string" ||
        !Number.isSafeInteger(service.interval) ||
        service.interval < 1 ||
        service.interval > 1000000 ||
        (service.initialInterval !== undefined && (!Number.isSafeInteger(service.initialInterval) || service.initialInterval < 1 || service.initialInterval > 1000000))
      )))
    )) {
      throw new Error("Format katalog motor tidak valid.");
    }
    vehicleCatalog = catalog.models;
    addCatalogOptions(vehicleCatalog);
    upgradeStoredCatalogSchedule();
  } catch (error) {
    console.error("Gagal memuat katalog motor:", error);
    setupFeedback.textContent = "Katalog belum bisa dimuat. Kamu tetap bisa isi data motor manual.";
  }
}

catalogSelect.addEventListener("change", () => {
  const model = vehicleCatalog.find(item => item.id === catalogSelect.value);
  if (!model) {
    catalogInfo.hidden = true;
    motorNameInput.value = "";
    motorTypeInput.disabled = false;
    motorTypeInput.value = "";
    updateTypeHint();
    return;
  }

  motorNameInput.value = `${model.brand} ${model.model} (${model.year})`;
  motorTypeInput.value = model.type;
  motorTypeInput.disabled = true;
  typeHint.textContent = "Jenis motor diisi dari katalog model.";
  catalogTitle.textContent = `${model.brand} ${model.model} · ${model.year}`;
  catalogLink.href = model.manualUrl;
  catalogLink.textContent = `Buka ${model.manualSource}`;
  catalogNote.textContent = model.scheduleVerified
    ? "Jadwal penggantian rutin dirangkum dari manual resmi. Servis pertama dihitung terpisah bila odometer masih rendah."
    : "Manual resmi tersedia, tetapi interval servis belum diverifikasi dan masih berupa contoh.";
  catalogInfo.hidden = false;
});

loadVehicleCatalog();

function openServiceDialog(serviceId = null) {
  const service = serviceId ? state.services.find(item => item.id === serviceId) : null;
  if (serviceId && !service) return;

  editingServiceId = service ? service.id : null;
  const isEditing = Boolean(service);
  const isCustom = Boolean(service?.custom);
  dialogTitle.textContent = isEditing ? "Atur jadwal part" : "Tambah part";
  dialogCopy.textContent = isEditing
    ? service.repeatInterval
      ? `Servis pertama tetap di ${formatKm(service.lastAt + service.interval)} km. Atur interval berulang setelahnya.`
      : `Sesuaikan interval dan kilometer servis terakhir (maksimal ${formatKm(state.odometer)} km).`
    : `Part baru mulai dihitung dari odometer ${formatKm(state.odometer)} km.`;
  serviceNameField.hidden = isEditing && !isCustom;
  serviceNameInput.value = isCustom ? service.name : "";
  serviceNameInput.required = !isEditing;
  serviceIntervalInput.value = isEditing ? service.repeatInterval || service.interval : "";
  const canEditLastAt = isEditing && !service.repeatInterval;
  serviceLastAtField.hidden = !canEditLastAt;
  serviceLastAtInput.required = canEditLastAt;
  if (canEditLastAt) {
    serviceLastAtInput.max = String(state.odometer);
    serviceLastAtInput.value = String(service.lastAt);
  } else {
    serviceLastAtInput.removeAttribute("max");
    serviceLastAtInput.value = "";
  }
  deleteServiceButton.hidden = !isCustom;
  dialogFeedback.textContent = "";
  serviceDialog.showModal();
  if (isEditing && !isCustom) serviceIntervalInput.focus();
  else serviceNameInput.focus();
}

function openPartsDialog() {
  partsVisibilityList.querySelectorAll(".part-toggle").forEach(label => label.remove());
  partsFeedback.textContent = "";
  state.services.forEach(service => {
    const label = createElement("label", "part-toggle");
    const name = createElement("span", "part-toggle-name", service.name);
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = service.visible !== false;
    input.setAttribute("aria-label", `Tampilkan ${service.name} di Ringkasan`);
    input.addEventListener("change", () => {
      const previousVisibility = service.visible;
      service.visible = input.checked;
      if (!saveState()) {
        service.visible = previousVisibility;
        input.checked = previousVisibility !== false;
        partsFeedback.textContent = "Perubahan belum tersimpan. Periksa ruang penyimpanan browser.";
        return;
      }
      partsFeedback.textContent = "";
      render();
    });
    label.append(name, input);
    partsVisibilityList.append(label);
  });
  partsDialog.showModal();
}

document.querySelector("#add-service-button").addEventListener("click", () => openServiceDialog());
document.querySelector("#manage-parts-button").addEventListener("click", openPartsDialog);
document.querySelector("#cancel-service-button").addEventListener("click", () => serviceDialog.close());

serviceForm.addEventListener("submit", event => {
  event.preventDefault();
  const interval = Number(serviceIntervalInput.value);
  const service = editingServiceId ? state.services.find(item => item.id === editingServiceId) : null;
  const name = service?.custom ? serviceNameInput.value.trim() : service ? service.name : serviceNameInput.value.trim();
  if (!Number.isSafeInteger(interval) || interval < 1 || interval > 1000000 || !name || name.length > 40) {
    dialogFeedback.textContent = "Isi nama part dan interval 1–1.000.000 km dengan benar.";
    return;
  }
  if (state.services.some(item => item.id !== editingServiceId && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    dialogFeedback.textContent = "Part dengan nama itu sudah ada di jadwal.";
    return;
  }

  if (service) {
    const canEditLastAt = !service.repeatInterval;
    const lastAt = canEditLastAt ? Number(serviceLastAtInput.value) : service.lastAt;
    if (canEditLastAt && (!Number.isSafeInteger(lastAt) || lastAt < 0 || lastAt > state.odometer)) {
      dialogFeedback.textContent = `Odometer servis terakhir harus antara 0 dan ${formatKm(state.odometer)} km.`;
      return;
    }
    const previous = { name: service.name, interval: service.interval, repeatInterval: service.repeatInterval, manualInterval: service.manualInterval, lastAt: service.lastAt, lastDate: service.lastDate };
    const intervalChanged = (service.repeatInterval || service.interval) !== interval;
    service.name = name;
    service.lastAt = lastAt;
    if (service.repeatInterval) service.repeatInterval = interval;
    else service.interval = interval;
    if (intervalChanged && service.manualInterval) service.manualInterval = false;
    if (!saveState()) {
      service.name = previous.name;
      service.interval = previous.interval;
      service.lastAt = previous.lastAt;
      if (previous.repeatInterval === undefined) delete service.repeatInterval;
      else service.repeatInterval = previous.repeatInterval;
      service.manualInterval = previous.manualInterval;
      return;
    }
    serviceDialog.close();
    render();
    showToast(`${service.name} berhasil diperbarui.`);
    return;
  }

  const customService = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    icon: "🔧",
    interval,
    lastAt: state.odometer,
    visible: true,
    custom: true
  };
  state.services.push(customService);
  if (!saveState()) {
    state.services.pop();
    return;
  }
  serviceDialog.close();
  render();
  showToast(`${name} ditambahkan ke jadwal.`);
});

deleteServiceButton.addEventListener("click", () => {
  const service = state.services.find(item => item.id === editingServiceId);
  if (!service?.custom || !window.confirm(`Hapus ${service.name} dari jadwal? Catatan servis sebelumnya tetap disimpan.`)) return;

  const previousServices = state.services;
  state.services = state.services.filter(item => item.id !== service.id);
  if (!saveState()) {
    state.services = previousServices;
    return;
  }
  serviceDialog.close();
  render();
  showToast(`${service.name} dihapus dari jadwal.`);
});

setupForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = motorNameInput.value.trim();
  const type = motorTypeInput.value;
  const odometer = Number(setupOdoInput.value);
  if (!name || name.length > 40 || !VEHICLE_TYPES.includes(type) || !Number.isSafeInteger(odometer) || odometer < 0) {
    setupFeedback.textContent = "Isi nama, jenis motor, dan odometer dengan benar.";
    return;
  }

  const previous = state;
  const now = new Date().toISOString();
  const catalogModel = vehicleCatalog.find(model => model.id === catalogSelect.value);
  state = {
    vehicle: {
      name,
      type,
      ...(catalogModel || {})
    },
    odometer,
    odometerLog: [{ odometer, date: now }],
    services: createServices(type, odometer, catalogModel),
    history: [],
    remindersEnabled: false,
    notifiedReminders: []
  };
  if (!saveState()) {
    state = previous;
    return;
  }
  render();
  showToast("Data motor berhasil disimpan.");
});

document.querySelector("#odo-form").addEventListener("submit", event => {
  event.preventDefault();
  const value = Number(odoInput.value);
  if (!Number.isSafeInteger(value) || value < state.odometer) {
    odoFeedback.textContent = "Angka harus valid dan tidak boleh lebih kecil dari odometer saat ini.";
    odoInput.setAttribute("aria-invalid", "true");
    return;
  }
  if (value === state.odometer) {
    odoFeedback.textContent = "Odometer masih sama dengan catatan terakhir.";
    odoInput.setAttribute("aria-invalid", "true");
    return;
  }

  const previous = state.odometer;
  const previousLog = state.odometerLog;
  state.odometer = value;
  state.odometerLog = [...previousLog, { odometer: value, date: new Date().toISOString() }];
  if (!saveState()) {
    state.odometer = previous;
    state.odometerLog = previousLog;
    return;
  }
  odoInput.value = "";
  odoInput.removeAttribute("aria-invalid");
  odoFeedback.textContent = `Odometer diperbarui ke ${formatKm(value)} km.`;
  render();
  showToast("Odometer berhasil diperbarui.");
});

correctInitialOdoButton.addEventListener("click", () => {
  if (!canCorrectInitialOdometer()) return;
  initialOdoCorrectionInput.value = String(state.odometer);
  odometerCorrectionFeedback.textContent = "";
  odometerCorrectionDialog.showModal();
  initialOdoCorrectionInput.focus();
});

document.querySelector("#cancel-odometer-correction").addEventListener("click", () => odometerCorrectionDialog.close());

odometerCorrectionForm.addEventListener("submit", event => {
  event.preventDefault();
  const correctedOdometer = Number(initialOdoCorrectionInput.value);
  if (!canCorrectInitialOdometer()) {
    odometerCorrectionFeedback.textContent = "Koreksi awal sudah tidak tersedia setelah ada catatan km atau servis.";
    return;
  }
  if (!Number.isSafeInteger(correctedOdometer) || correctedOdometer < 0) {
    odometerCorrectionFeedback.textContent = "Masukkan odometer berupa bilangan bulat 0 atau lebih.";
    return;
  }
  if (correctedOdometer === state.odometer) {
    odometerCorrectionFeedback.textContent = "Angkanya sama dengan catatan saat ini.";
    return;
  }

  const previousOdometer = state.odometer;
  const previousLog = state.odometerLog;
  const previousServices = state.services.map(service => ({
    service,
    lastAt: service.lastAt,
    interval: service.interval,
    repeatInterval: service.repeatInterval
  }));
  state.odometer = correctedOdometer;
  state.odometerLog = [{ ...previousLog[0], odometer: correctedOdometer }];
  state.services.forEach(service => {
    if (Number.isSafeInteger(service.initialInterval)) {
      if (correctedOdometer < service.initialInterval) {
        const repeatInterval = service.repeatInterval || service.interval;
        service.lastAt = 0;
        service.interval = service.initialInterval;
        service.repeatInterval = repeatInterval;
        return;
      }
      if (service.repeatInterval) {
        service.lastAt = correctedOdometer;
        service.interval = service.repeatInterval;
        delete service.repeatInterval;
        return;
      }
    }
    if (service.lastAt === previousOdometer) service.lastAt = correctedOdometer;
  });
  if (!saveState()) {
    state.odometer = previousOdometer;
    state.odometerLog = previousLog;
    previousServices.forEach(previous => {
      previous.service.lastAt = previous.lastAt;
      previous.service.interval = previous.interval;
      if (previous.repeatInterval === undefined) delete previous.service.repeatInterval;
      else previous.service.repeatInterval = previous.repeatInterval;
    });
    odometerCorrectionFeedback.textContent = "Koreksi belum tersimpan. Periksa ruang penyimpanan browser.";
    return;
  }
  odometerCorrectionDialog.close();
  odoFeedback.textContent = `Odometer awal dikoreksi ke ${formatKm(correctedOdometer)} km.`;
  render();
  showToast("Odometer awal dan jadwal servis berhasil dikoreksi.");
});

function markServiceDone(id) {
  const service = state.services.find(item => item.id === id);
  if (!service) return;
  if (!window.confirm(`Catat ${service.name} sudah diganti pada odometer ${formatKm(state.odometer)} km?`)) return;
  const previousLastAt = service.lastAt;
  const previousLastDate = service.lastDate;
  const previousInterval = service.interval;
  const previousRepeatInterval = service.repeatInterval;
  const historyEntry = { id, name: service.name, odometer: state.odometer, date: new Date().toISOString() };
  service.lastAt = state.odometer;
  service.lastDate = historyEntry.date;
  if (service.repeatInterval) {
    service.interval = service.repeatInterval;
    delete service.repeatInterval;
  }
  state.history.unshift(historyEntry);
  if (!saveState()) {
    service.lastAt = previousLastAt;
    service.lastDate = previousLastDate;
    service.interval = previousInterval;
    if (previousRepeatInterval === undefined) delete service.repeatInterval;
    else service.repeatInterval = previousRepeatInterval;
    const historyIndex = state.history.indexOf(historyEntry);
    if (historyIndex >= 0) state.history.splice(historyIndex, 1);
    return;
  }
  render();
  showToast(`${service.name} sudah diganti. Jadwal berikutnya mulai dari ${formatKm(state.odometer)} km.`, {
    label: "Urungkan",
    run: () => undoServiceDone(service, previousLastAt, previousLastDate, previousInterval, previousRepeatInterval, historyEntry)
  });
}

function undoServiceDone(service, previousLastAt, previousLastDate, previousInterval, previousRepeatInterval, historyEntry) {
  const historyIndex = state.history.indexOf(historyEntry);
  if (!state.services.includes(service) || historyIndex < 0) return;
  const currentLastAt = service.lastAt;
  const currentLastDate = service.lastDate;
  const currentInterval = service.interval;
  const currentRepeatInterval = service.repeatInterval;
  service.lastAt = previousLastAt;
  if (previousLastDate === undefined) delete service.lastDate;
  else service.lastDate = previousLastDate;
  service.interval = previousInterval;
  if (previousRepeatInterval === undefined) delete service.repeatInterval;
  else service.repeatInterval = previousRepeatInterval;
  state.history.splice(historyIndex, 1);
  if (!saveState()) {
    service.lastAt = currentLastAt;
    if (currentLastDate === undefined) delete service.lastDate;
    else service.lastDate = currentLastDate;
    service.interval = currentInterval;
    if (currentRepeatInterval === undefined) delete service.repeatInterval;
    else service.repeatInterval = currentRepeatInterval;
    state.history.splice(historyIndex, 0, historyEntry);
    return;
  }
  render();
  showToast(`${service.name} dikembalikan ke jadwal sebelumnya.`);
}

reminderButton.addEventListener("click", async () => {
  if (!("Notification" in window)) return;
  if (state.remindersEnabled && Notification.permission === "granted") {
    state.remindersEnabled = false;
    if (!saveState()) {
      state.remindersEnabled = true;
      return;
    }
    renderReminderSetting();
    showToast("Pengingat servis dimatikan.");
    return;
  }

  try {
    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
    if (permission !== "granted") {
      renderReminderSetting();
      showToast(permission === "denied"
        ? "Izin notifikasi diblokir di browser."
        : "Izin notifikasi belum diberikan.");
      return;
    }
    state.remindersEnabled = true;
    if (!saveState()) {
      state.remindersEnabled = false;
      return;
    }
    render();
    showToast("Pengingat servis berhasil diaktifkan.");
  } catch (error) {
    console.error("Gagal meminta izin notifikasi:", error);
    showToast("Izin notifikasi belum bisa diminta. Periksa pengaturan browser.");
  }
});

function parseImportedState(rawText) {
  const parsed = JSON.parse(rawText);
  const candidate = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
  if (
    !candidate ||
    typeof candidate.vehicle?.name !== "string" ||
    !candidate.vehicle.name.trim() ||
    candidate.vehicle.name.trim().length > 40 ||
    !VEHICLE_TYPES.includes(candidate.vehicle.type) ||
    !Number.isSafeInteger(candidate.odometer) ||
    candidate.odometer < 0 ||
    !Array.isArray(candidate.services) ||
    !candidate.services.length ||
    candidate.services.some(service =>
      !service ||
      typeof service.id !== "string" ||
      typeof service.name !== "string" ||
      !service.name.trim() ||
      typeof service.icon !== "string" ||
      !Number.isSafeInteger(service.interval) ||
      service.interval < 1 ||
      service.interval > 1000000 ||
      !Number.isSafeInteger(service.lastAt) ||
      service.lastAt < 0 ||
      service.lastAt > candidate.odometer ||
      (service.repeatInterval !== undefined && (!Number.isSafeInteger(service.repeatInterval) || service.repeatInterval < 1 || service.repeatInterval > 1000000))
    ) ||
    !Array.isArray(candidate.history) ||
    candidate.history.some(item =>
      !item ||
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      !Number.isSafeInteger(item.odometer) ||
      item.odometer < 0 ||
      typeof item.date !== "string" ||
      !Number.isFinite(Date.parse(item.date))
    )
  ) {
    throw new Error("Struktur file cadangan tidak valid.");
  }

  const vehicle = { ...candidate.vehicle, name: candidate.vehicle.name.trim() };
  const odometerLog = isValidOdometerLog(candidate.odometerLog, candidate.odometer)
    ? candidate.odometerLog
    : [{ odometer: candidate.odometer, date: new Date().toISOString() }];
  return {
    vehicle,
    odometer: candidate.odometer,
    odometerLog,
    services: candidate.services.map(service => ({ ...service, name: service.name.trim(), visible: service.visible !== false })),
    history: candidate.history,
    remindersEnabled: typeof candidate.remindersEnabled === "boolean" ? candidate.remindersEnabled : false,
    notifiedReminders: Array.isArray(candidate.notifiedReminders)
      ? candidate.notifiedReminders.filter(key => typeof key === "string").slice(-100)
      : []
  };
}

dataSettingsButton.addEventListener("click", () => {
  dataDialogFeedback.textContent = "";
  dataDialog.showModal();
});

exportDataButton.addEventListener("click", () => {
  if (!state.vehicle) return;
  const slug = state.vehicle.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "motor";
  const dateStamp = new Date().toISOString().slice(0, 10);
  const payload = JSON.stringify({ app: "roda", version: 2, exportedAt: new Date().toISOString(), data: state }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `roda-backup-${slug}-${dateStamp}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  dataDialog.close();
  showToast("File cadangan JSON berhasil diunduh.");
});

importDataButton.addEventListener("click", () => {
  dataDialogFeedback.textContent = "";
  importDataInput.value = "";
  importDataInput.click();
});

importDataInput.addEventListener("change", async () => {
  const file = importDataInput.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const importedState = parseImportedState(text);
    if (!window.confirm(`Pulihkan data untuk ${importedState.vehicle.name} (${formatKm(importedState.odometer)} km)? Data saat ini akan diganti.`)) {
      importDataInput.value = "";
      return;
    }
    const previousState = state;
    state = importedState;
    if (!saveState()) {
      state = previousState;
      dataDialogFeedback.textContent = "Data gagal disimpan. Periksa ruang penyimpanan browser.";
      return;
    }
    importDataInput.value = "";
    dataDialog.close();
    showDashboardTab("overview");
    render();
    showToast("Data cadangan berhasil dipulihkan.");
  } catch (error) {
    console.error("Gagal mengimpor cadangan:", error);
    dataDialogFeedback.textContent = "File cadangan tidak valid atau rusak.";
  }
});

resetVehicleButton.addEventListener("click", () => {
  if (!state.vehicle) return;
  if (!window.confirm(`Hapus data ${state.vehicle.name} dan mulai setup ulang? Pastikan kamu sudah ekspor cadangan jika diperlukan.`)) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Gagal menghapus data motor:", error);
    dataDialogFeedback.textContent = "Gagal menghapus data dari browser.";
    return;
  }
  state = emptyState();
  setupForm.reset();
  catalogSelect.value = "";
  catalogInfo.hidden = true;
  motorTypeInput.disabled = false;
  setupFeedback.textContent = "";
  updateTypeHint();
  dataDialog.close();
  showDashboardTab("overview");
  render();
  showToast("Data motor dihapus. Silakan isi data motor baru.");
});

overviewTab.addEventListener("click", () => showDashboardTab("overview"));
activityTab.addEventListener("click", () => showDashboardTab("activity"));

if (needsOdometerLogMigration) saveState();
render();

let installPrompt;
const installButton = document.querySelector("#install-button");
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.error("Gagal mendaftarkan service worker:", error);
    });
  });
}
>>>>>>> 0913f59421c7026ff23e498a98e95e93bd924213
