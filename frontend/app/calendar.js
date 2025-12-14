document.addEventListener("DOMContentLoaded", async () => {
  const calendarHost = document.getElementById("event-calendar");
  const emptyMessageEl = document.getElementById("calendar-empty-message");

  if (!calendarHost) {
    return;
  }

  if (typeof FullCalendar === "undefined") {
    console.error("FullCalendar 스크립트를 불러오지 못했습니다.");
    if (emptyMessageEl) {
      emptyMessageEl.textContent = "캘린더 스크립트를 불러오지 못했습니다.";
      emptyMessageEl.hidden = false;
    }
    return;
  }

  const ensureTooltip = (() => {
    let tooltip = document.querySelector(".custom-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "custom-tooltip";
      tooltip.style.display = "none";
      tooltip.innerHTML =
        '<div class="tooltip-arrow"></div><div class="tooltip-content"></div>';
      document.body.appendChild(tooltip);
    }
    const content = tooltip.querySelector(".tooltip-content");
    return { tooltip, content };
  })();

  const { tooltip, content: tooltipContent } = ensureTooltip;
  let pinnedEventEl = null;

  const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const extractClientPoint = (event) => {
    if (!event) {
      return { x: 0, y: 0 };
    }

    if (event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }

    if (event.changedTouches && event.changedTouches.length > 0) {
      return {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
    }

    return {
      x: event.clientX ?? 0,
      y: event.clientY ?? 0,
    };
  };

  const positionTooltip = (event) => {
    const point = extractClientPoint(event);
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = point.x - (tooltipRect.width / 2);
    let top = point.y + 16;

    if (left + tooltipRect.width > window.innerWidth - 12) {
      left = window.innerWidth - tooltipRect.width - 12;
    }
    if (top + tooltipRect.height > window.innerHeight - 12) {
      top = window.innerHeight - tooltipRect.height - 12;
    }

    tooltip.style.left = `${Math.max(12, left)}px`;
    tooltip.style.top = `${Math.max(12, top)}px`;
  };

  const buildEventPeriod = (startDate, endDate) => {
    if (!endDate) {
      return dateTimeFormatter.format(startDate);
    }

    const sameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    if (sameDay) {
      return `${dateFormatter.format(startDate)}\n${timeFormatter.format(
        startDate
      )} ~ ${timeFormatter.format(endDate)}`;
    }

    return `${dateTimeFormatter.format(startDate)} ~ ${dateTimeFormatter.format(
      endDate
    )}`;
  };

  const showTooltip = (event, info, options = {}) => {
    if (!tooltipContent) return;
    const { pin = false } = options;
    pinnedEventEl = pin ? info.el : null;
    const startDate = info.event.start;
    const endDate = info.event.end;

    tooltipContent.innerHTML = `
      <strong>${info.event.title}</strong><br>
      <span>${buildEventPeriod(startDate, endDate)}</span>
    `;
    tooltip.style.display = "block";
    positionTooltip(event);
  };

  const hideTooltip = (force = false) => {
    if (!force && pinnedEventEl) {
      return;
    }
    tooltip.style.display = "none";
    pinnedEventEl = null;
  };

  try {
    const response = await fetch("https://media.dsrwiki.com/data/csv/calendar.json", {
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rawData = await response.json();
    const sanitizedEvents = rawData
      .map((event) => {
        if (!event || !event.title || !event.start) {
          return null;
        }
        const mapped = {
          title: event.title,
          start: event.start,
        };

        if (event.end) {
          mapped.end = event.end;
        }
        if (event.backgroundColor) {
          mapped.backgroundColor = event.backgroundColor;
          mapped.borderColor = event.backgroundColor;
        }
        if (event.textColor) {
          mapped.textColor = event.textColor;
        }

        return mapped;
      })
      .filter(Boolean);

    if (sanitizedEvents.length === 0) {
      if (emptyMessageEl) {
        emptyMessageEl.textContent = "표시할 이벤트가 없습니다.";
        emptyMessageEl.hidden = false;
      }
      return;
    }

    const getIsMobile = () => window.matchMedia("(max-width: 768px)").matches;

    const buildToolbarConfig = () => ({
      left: "prev,next today",
      center: "customText",
      right: "currentMonth",
    });

    const calendar = new FullCalendar.Calendar(calendarHost, {
      locale: "ko",
      initialView: getIsMobile() ? "listWeek" : "dayGridMonth",
      headerToolbar: buildToolbarConfig(),
      buttonText: {
        today: "오늘",
        month: "월간",
        week: "주간",
        list: "목록",
      },
      customButtons: {
        customText: {
          text: "이벤트 캘린더",
        },
        currentMonth: {
          text: "",
        },
      },
      datesSet() {
        updateCurrentMonthLabel();
      },
      nowIndicator: true,
      navLinks: false,
      dayMaxEvents: false,
      displayEventTime: false,
      height: "auto",
      contentHeight: "auto",
      expandRows: true,
      events: sanitizedEvents,
      eventDidMount(info) {
        info.el.addEventListener("mouseenter", (evt) =>
          showTooltip(evt, info)
        );
        info.el.addEventListener("mousemove", positionTooltip);
        info.el.addEventListener("mouseleave", () => hideTooltip());
        info.el.addEventListener("click", (evt) => {
          if (pinnedEventEl === info.el && tooltip.style.display === "block") {
            hideTooltip(true);
            return;
          }
          showTooltip(evt, info, { pin: true });
        });
      },
    });

    const updateCurrentMonthLabel = () => {
      const currentMonthButton = calendarHost.querySelector(
        ".fc-currentMonth-button"
      );
      if (currentMonthButton) {
        currentMonthButton.textContent = calendar.view?.title ?? "";
      }
    };

    calendar.render();
    updateCurrentMonthLabel();

    const now = new Date();
    const upcoming = sanitizedEvents
      .map((event) => {
        const start = new Date(event.start);
        const end = event.end ? new Date(event.end) : null;
        return { event, start, end };
      })
      .filter(({ start }) => {
        if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
          return false;
        }
        return start >= now;
      })
      .sort((a, b) => a.start - b.start)[0];

    if (upcoming && upcoming.start) {
      calendar.gotoDate(upcoming.start);
    } else {
      calendar.gotoDate(now);
    }
    updateCurrentMonthLabel();

    const applyResponsiveOptions = () => {
      const isMobile = getIsMobile();
      const targetView = isMobile ? "listWeek" : "dayGridMonth";
      const currentView = calendar.view?.type;
      if (currentView !== targetView) {
        calendar.changeView(targetView);
      }
      calendar.setOption("headerToolbar", buildToolbarConfig());
      updateCurrentMonthLabel();
    };

    window.addEventListener("resize", applyResponsiveOptions);
    document.addEventListener("click", (evt) => {
      if (!pinnedEventEl) {
        return;
      }
      if (!pinnedEventEl.contains(evt.target)) {
        hideTooltip(true);
      }
    });

    if (emptyMessageEl) {
      emptyMessageEl.hidden = true;
    }
  } catch (error) {
    console.error("이벤트 캘린더 데이터를 불러오는 중 오류가 발생했습니다.", error);
    if (emptyMessageEl) {
      emptyMessageEl.textContent = "캘린더 데이터를 불러오지 못했습니다.";
      emptyMessageEl.hidden = false;
    }
  }
});

