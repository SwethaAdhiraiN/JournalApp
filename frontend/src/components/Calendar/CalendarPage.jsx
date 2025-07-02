import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CalendarPage.module.css";
import { API_BASE_URL } from "../../config";

/**
 * Expanded moods/emojis. Full spectrum to capture richer emotional diversity.
 * (If you want to customize further, edit this list).
 */
const MOOD_EMOJIS = [
  { label: "Excited", emoji: "😃" },
  { label: "Happy", emoji: "😊" },
  { label: "Content", emoji: "🙂" },
  { label: "Loved", emoji: "🥰" },
  { label: "Grateful", emoji: "🙏" },
  { label: "Relaxed", emoji: "😌" },
  { label: "Proud", emoji: "😎" },
  { label: "Energetic", emoji: "⚡️" },
  { label: "Neutral", emoji: "😐" },
  { label: "Bored", emoji: "😒" },
  { label: "Tired", emoji: "🥱" },
  { label: "Sad", emoji: "😢" },
  { label: "Lonely", emoji: "🥲" },
  { label: "Anxious", emoji: "😰" },
  { label: "Stressed", emoji: "😩" },
  { label: "Angry", emoji: "😠" },
  { label: "Frustrated", emoji: "😤" },
  { label: "Confused", emoji: "😕" },
  { label: "Worried", emoji: "😟" },
  { label: "Sick", emoji: "🤒" },
  { label: "Scared", emoji: "😨" },
  { label: "Hopeful", emoji: "🤞" },
  { label: "Motivated", emoji: "💪" },
  { label: "Surprised", emoji: "😲" },
  { label: "Calm", emoji: "🧘" }
];
// You can adjust this list as desired!

/**
 * Lookup map: {label: emoji, ...}
 * For faster lookups from mood label -> emoji
 */
const MOOD_LABEL_TO_EMOJI = Object.fromEntries(
  MOOD_EMOJIS.map((m) => [m.label, m.emoji])
);

function getToday() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    date: now.getDate(),
    day: now.getDay(),
  };
}

function getMonthDays(year, month) {
  // Month: 0 = January
  // Returns: array of weeks, each week is an array of either date number or null
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDay = first.getDay(); // 0=Sun
  const numDays = last.getDate();

  let weeks = [];
  let week = new Array(7).fill(null);
  let dayOfWeek = firstDay;
  // Fill first week
  for (let i = 1; i <= numDays; i++) {
    week[dayOfWeek] = i;
    if (dayOfWeek === 6 || i === numDays) {
      weeks.push([...week]);
      week = new Array(7).fill(null);
    }
    dayOfWeek = (dayOfWeek + 1) % 7;
  }
  return weeks;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Fullscreen interactive calendar with today's cell clickable for mood/journal entry.
 * Design per assets/calendar_design_notes.md. Uses provided palette.
 * Now includes Logout button and session clearing.
 */
/**
 * PUBLIC_INTERFACE
 * CalendarPage: JournalApp calendar that after login fetches user's mood and journal entries for current month,
 * and displays the relevant emoji per date on the calendar grid.
 */
function CalendarPage() {
  const today = getToday();
  const year = today.year;
  const month = today.month;
  const monthLabel = MONTHS[month] + " " + year;
  const calendarWeeks = getMonthDays(year, month);

  const [mood, setMood] = useState(null); // {label,emoji} for today (for modal/display)
  const [journal, setJournal] = useState(""); // journal for today
  const [modalOpen, setModalOpen] = useState(false);
  const [tempMood, setTempMood] = useState(null);
  const [tempJournal, setTempJournal] = useState("");

  // New: Store all user's mood entries and journal entries for this month
  // moodByDate: { '2024-07-01': {label, emoji}, ... }
  // journalByDate: { '2024-07-01': "text...", ... }
  const [moodByDate, setMoodByDate] = useState({});
  const [journalByDate, setJournalByDate] = useState({});

  const navigate = useNavigate();

  // Fetch all mood and journal entries for user, month
  // -- MODIFICATION: this effect will also re-run after login and on /calendar navigation (when localStorage username changes) --
  useEffect(() => {
    /**
     * On mount or after login: fetch mood and journal data for the logged-in user from the backend.
     * Populate state so the calendar visually reflects all mood entries (emoji under date).
     * Now, also fetches entire mood history and displays all moods per date (not just one/the last one).
     */
    async function fetchUserData() {
      const username = localStorage.getItem("journalapp-username");
      if (!username) {
        setMoodByDate({});
        setJournalByDate({});
        setMood(null);
        setJournal("");
        return;
      }

      // Helper to POST to backend for moods (returns: { date: [mood, ...], ... })
      async function fetchUserMoods() {
        try {
          const resp = await fetch(`${API_BASE_URL}/get-moods`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });
          if (!resp.ok) return {};
          const out = await resp.json();
          return out.moods || {};
        } catch {
          return {};
        }
      }
      // Journal fallback: old GET for MVP; replace with similar endpoint for journals if needed
      async function fetchJson(relativeUrl) {
        try {
          const resp = await fetch(
            `${API_BASE_URL.replace(/\/$/, "")}${relativeUrl}`,
            { method: "GET" }
          );
          if (!resp.ok) return {};
          return await resp.json();
        } catch (err) {
          return {};
        }
      }

      // URLs for old raw journal fetch
      const journalUrl = "/../database/journal.json";

      // Fetch user mood dict using new REST API, and journal as previously
      const [userMoods, allJournals] = await Promise.all([
        fetchUserMoods(), fetchJson(journalUrl)
      ]);

      // Gather moods/journal for all possible visible calendar dates (per Month)
      const moodObj = {};
      const journalObj = {};
      const yearStr = String(year);
      const monthStr = String(month + 1).padStart(2, "0");

      function getCalendarDates(year, month, weeks) {
        // Return a list of YYYY-MM-DD strings for every date in the grid (non-null days)
        const days = [];
        for (const week of weeks) {
          for (const d of week) {
            if (d) {
              days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
            }
          }
        }
        return days;
      }

      const calendarDates = getCalendarDates(year, month, calendarWeeks);

      // Build moodObj: for each date, store the full moods (array of objects: {label, emoji})
      if (userMoods) {
        Object.entries(userMoods).forEach(([date, moodArr]) => {
          if (calendarDates.includes(date) && Array.isArray(moodArr) && moodArr.length > 0) {
            // Each date now stores a list (not just last)
            moodObj[date] = moodArr.map((label) => ({
              label,
              emoji: MOOD_LABEL_TO_EMOJI[label] || "❓"
            }));
          }
        });
      }
      if (allJournals && allJournals[username]) {
        Object.entries(allJournals[username]).forEach(([date, journalArr]) => {
          if (calendarDates.includes(date) && Array.isArray(journalArr) && journalArr.length > 0) {
            journalObj[date] = journalArr[journalArr.length - 1];
          }
        });
      }

      setMoodByDate(moodObj);
      setJournalByDate(journalObj);

      // Set today's entry for modal display state (if present, use latest only for single mood/journal)
      const todayStr = `${yearStr}-${monthStr}-${String(today.date).padStart(2, "0")}`;
      const todayMoods = moodObj[todayStr];
      setMood(todayMoods && todayMoods.length > 0 ? todayMoods[todayMoods.length - 1] : null);
      setJournal(journalObj[todayStr] || "");
    }

    fetchUserData();
    // Extra: rerun when user logs in/out or month/year changes (so calendar refreshes automatically after /login navigation)
    // eslint-disable-next-line
  }, [year, month, localStorage.getItem("journalapp-username")]);

  function handleTodayClick() {
    setTempMood(mood);
    setTempJournal(journal);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  // PUBLIC_INTERFACE
  function handleLogout() {
    /** Clear login state and redirect to Home ('/'). */
    localStorage.removeItem("journalapp-username");
    navigate("/", { replace: true });
  }

  /**
   * Always overwrite the mood or journal entry for today's date.
   * If an entry for this date already exists, it will be replaced (frontend state & backend).
   * If empty, do nothing.
   */
  async function handleSave() {
    if (!tempMood && tempJournal.trim() === "") {
      setModalOpen(false);
      return;
    }

    const username = localStorage.getItem("journalapp-username") || "demo-user";
    const yearStr = String(today.year);
    const monthStr = String(today.month + 1).padStart(2, "0");
    const day = today.date;
    const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, "0")}`;

    // Generic POST function for mood/journal submission
    async function postToBackend(path, body) {
      try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        return await res.json();
      } catch {
        return { detail: "Network/server error." };
      }
    }

    // Always POST mood and/or journal for today. This will overwrite any previous entry for the date (per backend).
    if (tempMood) {
      await postToBackend("/submit-mood", {
        username,
        date: dateStr,
        mood: tempMood.label,
      });
      setMood(tempMood);
      setMoodByDate((prev) => ({
        ...prev,
        [dateStr]: tempMood,
      }));
    }
    if (tempJournal.trim()) {
      await postToBackend("/submit-journal", {
        username,
        date: dateStr,
        journal: tempJournal.trim(),
      });
      setJournal(tempJournal.trim());
      setJournalByDate((prev) => ({
        ...prev,
        [dateStr]: tempJournal.trim(),
      }));
    }
    setModalOpen(false);
  }

  /**
   * Updated helper: render every cell stacking all moods below the date as a responsive list.
   * For each date, if tracked moods exist: list all moods below the date, vertically, responsive.
   */
  function renderDayCell(dateNum, weekIdx, dayIdx) {
    if (!dateNum) {
      return (
        <div
          key={`empty-${weekIdx}-${dayIdx}`}
          className={styles.calendarCell}
          aria-hidden="true"
        />
      );
    }
    const isToday =
      dateNum === today.date && month === today.month && year === today.year;

    // Date string in API format
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dateNum).padStart(2, "0")}`;
    const dayMoods = moodByDate[dateStr];
    const dayJournal = journalByDate[dateStr];

    // Renders a vertical stack of all moods for this date, each as emoji + (label if device is wide enough)
    const renderMoodStack = () => (
      <div
        className={styles.moodStack}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          rowGap: "2px",
          marginTop: 2,
        }}
      >
        {Array.isArray(dayMoods) && dayMoods.map((moodObj, idx) => (
          <span
            className={styles.moodEmoji}
            key={moodObj.emoji + "-" + idx}
            title={moodObj.label}
            style={{
              // Responsive: stack tightly, on small screens only emoji, on larger screens emoji+label
              display: "flex",
              alignItems: "center",
              fontSize: "1.25rem",
              lineHeight: 1,
            }}
          >
            <span role="img" aria-label={moodObj.label}>{moodObj.emoji}</span>
            <span
              className={styles.moodLabel}
              style={{
                marginLeft: 4,
                fontSize: "0.78em",
                color: "#1DAA9A",
                fontWeight: 500,
                display: window.innerWidth > 500 ? "inline" : "none",
              }}
            >
              {moodObj.label}
            </span>
          </span>
        ))}
      </div>
    );

    if (isToday) {
      return (
        <button
          key={`today-${dateNum}`}
          className={`${styles.calendarCell} ${styles.todayCell} ${modalOpen ? styles.activeCell : ""}`}
          aria-current="date"
          aria-label={`Today, ${MONTHS[month]} ${dateNum}${
            Array.isArray(dayMoods) && dayMoods.length > 0
              ? `. Moods: ${dayMoods.map((m) => m.label).join(", ")}`
              : ""
          }`}
          tabIndex={0}
          type="button"
          onClick={handleTodayClick}
        >
          <span className={styles.dateNum}>{dateNum}</span>
          {/* Display all moods as a vertical stack below number */}
          {(Array.isArray(dayMoods) && dayMoods.length > 0)
            ? renderMoodStack()
            : (dayJournal
              ? (
                  <span className={styles.dotEntry} title="Journal entry">
                    •
                  </span>
                )
              : null)
          }
        </button>
      );
    }
    // Other dates: show mood history as vertical stack, or dot for journal entry
    return (
      <div
        key={`date-${dateNum}`}
        className={styles.calendarCell}
        aria-label={`${MONTHS[month]} ${dateNum}${
          Array.isArray(dayMoods) && dayMoods.length > 0
            ? `. Moods: ${dayMoods.map((m) => m.label).join(", ")}`
            : ""
        }`}
        aria-disabled="true"
      >
        <span className={styles.dateNumOther}>{dateNum}</span>
        {/* Show all moods as vertical stack */}
        {(Array.isArray(dayMoods) && dayMoods.length > 0)
          ? renderMoodStack()
          : (dayJournal
              ? (
                  <span className={styles.dotEntry} title="Journal entry">
                    •
                  </span>
                )
              : null)
        }
      </div>
    );
  }

  // Inject Logout button top-right using absolute/flex position inside header
  return (
    <div className={styles.calendarRoot} aria-label="Journal mood calendar">
      <div className={styles.calendarContainer}>
        <header
          className={styles.calendarHeader}
          aria-label={`${MONTHS[month]} ${year}`}
          style={{ position: "relative" }}
        >
          <span className={styles.monthLabel}>{monthLabel}</span>
          <button
            className={styles.logoutButton}
            type="button"
            aria-label="Logout"
            title="Logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>
        <div className={styles.daysRow} role="row">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
            <div
              className={styles.dayLabel}
              role="columnheader"
              key={d}
              aria-label={d}
            >
              {d}
            </div>
          ))}
        </div>
        <div className={styles.calendarGrid} role="rowgroup">
          {calendarWeeks.map((week, widx) =>
            week.map((dateNum, didx) => renderDayCell(dateNum, widx, didx))
          )}
        </div>
        <div className={styles.moodDisplay} aria-live="polite">
          {mood && (
            <div>
              <span role="img" aria-label={mood.label}>
                {mood.emoji}
              </span>
              <span className={styles.moodLabel}>{mood.label}</span>
            </div>
          )}
          {journal && (
            <div className={styles.journalEntryDisplay}>
              <span className={styles.journalIcon} title="Journal entry">
                📝
              </span>
              <span>{journal}</span>
            </div>
          )}
        </div>
      </div>
      {modalOpen && (
        <div
          className={styles.modalOverlay}
          tabIndex={-1}
          role="presentation"
          aria-modal="true"
          aria-label="Mood and journal modal"
          onClick={closeModal}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Select mood and enter journal"
            tabIndex={0}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>How are you feeling today?</h2>
            <div className={styles.emojiGrid}>
              {MOOD_EMOJIS.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  className={`${styles.emojiButton} ${
                    tempMood?.emoji === m.emoji ? styles.emojiSelected : ""
                  }`}
                  aria-label={m.label}
                  onClick={() => setTempMood(m)}
                >
                  <span
                    role="img"
                    aria-label={m.label}
                    style={{ fontSize: "2rem" }}
                  >
                    {m.emoji}
                  </span>
                </button>
              ))}
            </div>
            <textarea
              className={styles.journalInput}
              rows={3}
              placeholder="Write your journal entry (optional)..."
              value={tempJournal}
              onChange={(e) => setTempJournal(e.target.value)}
              aria-label="Journal entry for today"
            />
            <div className={styles.modalActions}>
              <button
                className={styles.saveButton}
                type="button"
                onClick={handleSave}
                disabled={!tempMood && tempJournal.trim() === ""}
              >
                Save
              </button>
              <button
                className={styles.cancelButton}
                type="button"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
