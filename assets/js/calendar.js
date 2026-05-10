(function () {
  var root = document.querySelector("[data-calendar]");

  if (!root) {
    return;
  }

  var DATA_URL = "assets/data/events.json";
  var EDITOR_PIN = "1234";
  var today = startOfDay(new Date());
  var activeDate = startOfDay(today);
  var selectedDateKey = toDateKey(today);
  var activeView = "month";
  var events = [];
  var editingEventId = "";
  var pendingImage = "";

  var rangeEl = root.querySelector("[data-calendar-range]");
  var statusEl = root.querySelector("[data-calendar-status]");
  var weekdaysEl = root.querySelector("[data-calendar-weekdays]");
  var gridEl = root.querySelector("[data-calendar-grid]");
  var detailsEl = root.querySelector("[data-calendar-details]");
  var prevButton = root.querySelector("[data-calendar-prev]");
  var nextButton = root.querySelector("[data-calendar-next]");
  var todayButton = root.querySelector("[data-calendar-today]");
  var viewButtons = root.querySelectorAll("[data-calendar-view]");
  var authForm = root.querySelector("[data-calendar-auth]");
  var pinInput = root.querySelector("[data-calendar-pin]");
  var editorForm = root.querySelector("[data-calendar-form]");
  var eventIdInput = root.querySelector("[data-calendar-event-id]");
  var dateInput = root.querySelector("[data-calendar-date]");
  var titleInput = root.querySelector("[data-calendar-title]");
  var imageInput = root.querySelector("[data-calendar-image]");
  var previewEl = root.querySelector("[data-calendar-preview]");
  var newButton = root.querySelector("[data-calendar-new]");
  var deleteButton = root.querySelector("[data-calendar-delete]");
  var exportButton = root.querySelector("[data-calendar-export]");

  var shortDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  });
  var longDateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  var monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  });

  init();

  function init() {
    renderWeekdayLabels();
    bindEvents();
    resetEditor(selectedDateKey);
    loadEvents();
  }

  function bindEvents() {
    prevButton.addEventListener("click", function () {
      activeDate = activeView === "month" ? addMonths(activeDate, -1) : addDays(activeDate, -7);
      selectedDateKey = toDateKey(activeDate);
      resetEditor(selectedDateKey);
      render();
    });

    nextButton.addEventListener("click", function () {
      activeDate = activeView === "month" ? addMonths(activeDate, 1) : addDays(activeDate, 7);
      selectedDateKey = toDateKey(activeDate);
      resetEditor(selectedDateKey);
      render();
    });

    todayButton.addEventListener("click", function () {
      today = startOfDay(new Date());
      activeDate = startOfDay(today);
      selectedDateKey = toDateKey(today);
      resetEditor(selectedDateKey);
      render();
    });

    viewButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeView = button.getAttribute("data-calendar-view");
        activeDate = toLocalDate(selectedDateKey);
        resetEditor(selectedDateKey);
        render();
      });
    });

    authForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (pinInput.value === EDITOR_PIN) {
        editorForm.hidden = false;
        authForm.hidden = true;
        renderDetails();
        setStatus("Editor unlocked.", "success");
        dateInput.focus();
        return;
      }

      setStatus("Incorrect PIN.", "error");
      pinInput.select();
    });

    editorForm.addEventListener("submit", function (event) {
      event.preventDefault();
      saveEvent();
    });

    imageInput.addEventListener("change", function () {
      var file = imageInput.files && imageInput.files[0];

      if (!file) {
        return;
      }

      if (!file.type || file.type.indexOf("image/") !== 0) {
        imageInput.value = "";
        setStatus("Choose an image file.", "error");
        return;
      }

      imageFileToDataUrl(file)
        .then(function (dataUrl) {
          pendingImage = dataUrl;
          renderPreview();
          setStatus("Image ready.", "success");
        })
        .catch(function () {
          imageInput.value = "";
          setStatus("Image could not be loaded.", "error");
        });
    });

    newButton.addEventListener("click", function () {
      resetEditor(selectedDateKey);
      titleInput.focus();
    });

    deleteButton.addEventListener("click", function () {
      if (!editingEventId) {
        return;
      }

      events = events.filter(function (eventItem) {
        return eventItem.id !== editingEventId;
      });
      resetEditor(selectedDateKey);
      render();
      setStatus("Event deleted. Export the JSON file to publish changes.", "success");
    });

    exportButton.addEventListener("click", exportEvents);
  }

  function loadEvents() {
    setStatus("Loading calendar.", "");

    fetch(DATA_URL, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Calendar data request failed.");
        }

        return response.json();
      })
      .then(function (data) {
        events = normalizeEvents(data);
        render();
        setStatus("", "");
      })
      .catch(function () {
        events = [];
        render();
        setStatus("Calendar data could not be loaded.", "error");
      });
  }

  function saveEvent() {
    var date = dateInput.value;
    var title = titleInput.value.trim();

    if (!isDateKey(date)) {
      setStatus("Choose a valid date.", "error");
      dateInput.focus();
      return;
    }

    if (!title) {
      setStatus("Enter an event name.", "error");
      titleInput.focus();
      return;
    }

    var existing = findEvent(editingEventId);

    if (!pendingImage && !(existing && existing.image)) {
      setStatus("Choose an event image.", "error");
      imageInput.focus();
      return;
    }

    var savedEvent = {
      id: existing ? existing.id : createEventId(date, title),
      date: date,
      title: title,
      image: pendingImage || (existing ? existing.image : ""),
      imageAlt: title
    };

    if (existing) {
      events = events.map(function (eventItem) {
        return eventItem.id === existing.id ? savedEvent : eventItem;
      });
    } else {
      events.push(savedEvent);
    }

    events = sortEvents(events);
    selectedDateKey = date;
    activeDate = toLocalDate(date);
    editEvent(savedEvent.id);
    render();
    setStatus("Event saved. Export the JSON file to publish changes.", "success");
  }

  function exportEvents() {
    var json = JSON.stringify(sortEvents(events), null, 2) + "\n";
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = "events.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("events.json exported.", "success");
  }

  function render() {
    root.setAttribute("data-active-view", activeView);
    renderRange();
    renderViewButtons();
    renderGrid();
    renderDetails();
  }

  function renderRange() {
    if (activeView === "month") {
      rangeEl.textContent = monthFormatter.format(activeDate);
      return;
    }

    var start = startOfWeek(activeDate);
    var end = addDays(start, 6);
    rangeEl.textContent = shortDateFormatter.format(start) + " - " + shortDateFormatter.format(end);
  }

  function renderViewButtons() {
    viewButtons.forEach(function (button) {
      var isActive = button.getAttribute("data-calendar-view") === activeView;
      button.classList.toggle("calendar__button--active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function renderWeekdayLabels() {
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdaysEl.replaceChildren();

    days.forEach(function (day) {
      var label = document.createElement("span");
      label.textContent = day;
      weekdaysEl.appendChild(label);
    });
  }

  function renderGrid() {
    var dates = activeView === "month" ? getMonthDates(activeDate) : getWeekDates(activeDate);

    gridEl.classList.toggle("calendar__grid--week", activeView === "week");
    gridEl.replaceChildren();

    dates.forEach(function (date) {
      gridEl.appendChild(createDateCell(date));
    });
  }

  function createDateCell(date) {
    var dateKey = toDateKey(date);
    var dateEvents = eventsForDate(dateKey);
    var cell = document.createElement("button");
    var number = document.createElement("span");
    var eventList = document.createElement("span");

    cell.type = "button";
    cell.className = "calendar-day";
    cell.setAttribute("data-date", dateKey);
    cell.setAttribute("aria-label", longDateFormatter.format(date));

    if (date.getMonth() !== activeDate.getMonth() && activeView === "month") {
      cell.classList.add("calendar-day--muted");
    }

    if (dateKey === toDateKey(today)) {
      cell.classList.add("calendar-day--today");
    }

    if (dateKey === selectedDateKey) {
      cell.classList.add("calendar-day--selected");
    }

    number.className = "calendar-day__number";
    number.textContent = String(date.getDate());
    cell.appendChild(number);

    eventList.className = "calendar-day__events";
    dateEvents.slice(0, activeView === "week" ? 4 : 2).forEach(function (eventItem) {
      eventList.appendChild(createEventPill(eventItem));
    });

    if (dateEvents.length > (activeView === "week" ? 4 : 2)) {
      var more = document.createElement("span");
      more.className = "calendar-day__more";
      more.textContent = "+" + (dateEvents.length - (activeView === "week" ? 4 : 2));
      eventList.appendChild(more);
    }

    cell.appendChild(eventList);
    cell.addEventListener("click", function () {
      selectedDateKey = dateKey;
      activeDate = date;
      resetEditor(selectedDateKey);
      render();
    });

    return cell;
  }

  function createEventPill(eventItem) {
    var pill = document.createElement("span");
    var title = document.createElement("span");

    pill.className = "calendar-event-pill";

    if (eventItem.image) {
      var image = document.createElement("img");
      image.className = "calendar-event-pill__image";
      image.src = eventItem.image;
      image.alt = "";
      image.loading = "lazy";
      pill.appendChild(image);
    }

    title.className = "calendar-event-pill__title";
    title.textContent = eventItem.title;
    pill.appendChild(title);

    return pill;
  }

  function renderDetails() {
    var selectedDate = toLocalDate(selectedDateKey);
    var dateEvents = eventsForDate(selectedDateKey);
    var title = document.createElement("h3");
    var list = document.createElement("div");

    detailsEl.replaceChildren();
    title.className = "calendar__details-heading";
    title.textContent = longDateFormatter.format(selectedDate);
    detailsEl.appendChild(title);

    if (!dateEvents.length) {
      var empty = document.createElement("p");
      empty.className = "calendar__empty";
      empty.textContent = "No events.";
      detailsEl.appendChild(empty);
      return;
    }

    list.className = "calendar-event-list";

    dateEvents.forEach(function (eventItem) {
      list.appendChild(createEventCard(eventItem));
    });

    detailsEl.appendChild(list);
  }

  function createEventCard(eventItem) {
    var card = document.createElement("article");
    var body = document.createElement("div");
    var title = document.createElement("h4");

    card.className = "calendar-event";

    if (eventItem.image) {
      var image = document.createElement("img");
      image.className = "calendar-event__image";
      image.src = eventItem.image;
      image.alt = eventItem.imageAlt || eventItem.title;
      image.loading = "lazy";
      card.appendChild(image);
    }

    body.className = "calendar-event__body";
    title.className = "calendar-event__title";
    title.textContent = eventItem.title;
    body.appendChild(title);

    if (!editorForm.hidden) {
      var editButton = document.createElement("button");
      editButton.className = "calendar__button calendar-event__edit";
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", function () {
        editEvent(eventItem.id);
      });
      body.appendChild(editButton);
    }

    card.appendChild(body);
    return card;
  }

  function resetEditor(dateKey) {
    editingEventId = "";
    pendingImage = "";
    eventIdInput.value = "";
    dateInput.value = dateKey;
    titleInput.value = "";
    imageInput.value = "";
    deleteButton.hidden = true;
    renderPreview();
  }

  function editEvent(eventId) {
    var eventItem = findEvent(eventId);

    if (!eventItem) {
      return;
    }

    editingEventId = eventItem.id;
    pendingImage = eventItem.image || "";
    eventIdInput.value = eventItem.id;
    dateInput.value = eventItem.date;
    titleInput.value = eventItem.title;
    imageInput.value = "";
    selectedDateKey = eventItem.date;
    activeDate = toLocalDate(eventItem.date);
    deleteButton.hidden = false;
    renderPreview();
    titleInput.focus();
  }

  function renderPreview() {
    previewEl.replaceChildren();

    if (!pendingImage) {
      previewEl.hidden = true;
      return;
    }

    var image = document.createElement("img");
    image.src = pendingImage;
    image.alt = "";
    previewEl.appendChild(image);
    previewEl.hidden = false;
  }

  function eventsForDate(dateKey) {
    return events.filter(function (eventItem) {
      return eventItem.date === dateKey;
    });
  }

  function findEvent(eventId) {
    if (!eventId) {
      return null;
    }

    return events.find(function (eventItem) {
      return eventItem.id === eventId;
    }) || null;
  }

  function normalizeEvents(data) {
    if (!Array.isArray(data)) {
      return [];
    }

    return sortEvents(data.map(function (item) {
      var date = typeof item.date === "string" ? item.date : "";
      var title = typeof item.title === "string" ? item.title.trim() : "";

      if (!isDateKey(date) || !title) {
        return null;
      }

      return {
        id: typeof item.id === "string" && item.id ? item.id : createEventId(date, title),
        date: date,
        title: title,
        image: typeof item.image === "string" ? item.image : "",
        imageAlt: typeof item.imageAlt === "string" ? item.imageAlt : title
      };
    }).filter(Boolean));
  }

  function sortEvents(eventList) {
    return eventList.slice().sort(function (first, second) {
      if (first.date !== second.date) {
        return first.date < second.date ? -1 : 1;
      }

      return first.title.localeCompare(second.title);
    });
  }

  function getMonthDates(date) {
    var first = startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
    var last = addDays(startOfWeek(new Date(date.getFullYear(), date.getMonth() + 1, 0)), 6);
    var dates = [];
    var cursor = first;

    while (cursor <= last) {
      dates.push(startOfDay(cursor));
      cursor = addDays(cursor, 1);
    }

    return dates;
  }

  function getWeekDates(date) {
    var first = startOfWeek(date);
    var dates = [];

    for (var index = 0; index < 7; index += 1) {
      dates.push(addDays(first, index));
    }

    return dates;
  }

  function imageFileToDataUrl(file) {
    return readFileAsDataUrl(file).then(function (dataUrl) {
      return compressImage(dataUrl);
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();

      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function compressImage(dataUrl) {
    return new Promise(function (resolve, reject) {
      var image = new Image();

      image.onload = function () {
        var maxSize = 900;
        var ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
        var width = Math.max(1, Math.round(image.width * ratio));
        var height = Math.max(1, Math.round(image.height * ratio));
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      image.onerror = reject;
      image.src = dataUrl;
    });
  }

  function createEventId(date, title) {
    return [
      date,
      slugify(title).slice(0, 36) || "event",
      Date.now().toString(36),
      Math.random().toString(36).slice(2, 7)
    ].join("-");
  }

  function slugify(value) {
    return value.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function setStatus(message, tone) {
    statusEl.textContent = message;
    statusEl.setAttribute("data-tone", tone || "");
  }

  function addDays(date, amount) {
    var result = new Date(date);
    result.setDate(result.getDate() + amount);
    return startOfDay(result);
  }

  function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function startOfWeek(date) {
    return addDays(startOfDay(date), -startOfDay(date).getDay());
  }

  function toLocalDate(dateKey) {
    var parts = dateKey.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function toDateKey(date) {
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("-");
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function isDateKey(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    var date;

    if (!match) {
      return false;
    }

    date = toLocalDate(value);
    return toDateKey(date) === value;
  }
})();
