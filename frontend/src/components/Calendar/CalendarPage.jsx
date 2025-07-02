import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CalendarPage.module.css";
import { API_BASE_URL } from "../../config";

// Moods and emoji used for mood selection
const MOOD_EMOJIS = [
  { label: "Happy", emoji: "😃" },
  { label: "Content", emoji: "😊" },
  { label: "Neutral", emoji: "😐" },
  { label: "Sad", emoji: "😢" },
  { label: "Angry", emoji: "😠" },
  { label: "Excited", emoji: "🤩" },
  { label: "Tired", emoji: "🥱" },
];

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
  useEffect(() => {
    /**
     * On mount: fetch mood and journal data from the backend for the logged-in user.
     * Populates state to display mood emoji for each calendar date where a mood is present.
     */
    async function fetchUserData() {
      const username = localStorage.getItem("journalapp-username");
      if (!username) return;

      // Fetch mood data for logged in user
      let moods = {};
      try {
        // Backend exposes the data file directly for this simplified MVP
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/../database/mood.json`, { method: "GET" });
        if (res.ok) {
          moods = await res.json();
        }
      } catch {
        moods = {};
      }

      // Fetch journal data for logged in user
      let journals = {};
      try {
        const res2 = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/../database/journal.json`, { method: "GET" });
        if (res2.ok) {
          journals = await res2.json();
        }
      } catch {
        journals = {};
      }

      // Only show mood/journal entries for dates that actually appear in this month's calendar
      const moodObj = {};
      const journalObj = {};
      const yearStr = String(year);
      const monthStr = String(month + 1).padStart(2, "0");

      function getCalendarDates(year, month, weeks) {
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

      if (moods && moods[username]) {
        Object.entries(moods[username]).forEach(([date, moodArr]) => {
          if (calendarDates.includes(date) && Array.isArray(moodArr) && moodArr.length > 0) {
            const label = moodArr[moodArr.length - 1];
            moodObj[date] = {
              label,
              emoji: MOOD_LABEL_TO_EMOJI[label] || "❓",
            };
          }
        });
      }

      if (journals && journals[username]) {
        Object.entries(journals[username]).forEach(([date, journalArr]) => {
          if (calendarDates.includes(date) && Array.isArray(journalArr) && journalArr.length > 0) {
            journalObj[date] = journalArr[journalArr.length - 1];
          }
        });
      }

      setMoodByDate(moodObj);
      setJournalByDate(journalObj);

      // Set today's data for modal display
      const todayStr = `${yearStr}-${monthStr}-${String(today.date).padStart(2, "0")}`;
      setMood(moodObj[todayStr] || null);
      setJournal(journalObj[todayStr] || "");
    }

    fetchUserData();

    // Rerun on month or year change (single month for this design)
    // eslint-disable-next-line
  }, [year, month]);

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

  async function handleSave() {
    if (!tempMood && tempJournal.trim() === "") {
      // No changes
      setModalOpen(false);
      return;
    }

    const username = localStorage.getItem("journalapp-username") || "demo-user";
    const yearStr = String(today.year);
    const monthStr = String(today.month + 1).padStart(2, "0");
    const day = today.date;
    const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, "0")}`;

    // Helper to POST to backend
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

    // Persist mood if changed
    if (tempMood && (!mood || tempMood.emoji !== mood.emoji)) {
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
    // Persist journal if changed
    if (tempJournal.trim() && tempJournal.trim() !== journal) {
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

  // Helper for rendering each cell, now includes emoji display for each date
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
    const dayMood = moodByDate[dateStr];
    const dayJournal = journalByDate[dateStr];

    if (isToday) {
      return (
        <button
          key={`today-${dateNum}`}
          className={`${styles.calendarCell} ${styles.todayCell} ${modalOpen ? styles.activeCell : ""}`}
          aria-current="date"
          aria-label={`Today, ${MONTHS[month]} ${dateNum}${dayMood ? `. Mood selected: ${dayMood.label}` : ""}`}
          tabIndex={0}
          type="button"
          onClick={handleTodayClick}
        >
          <span className={styles.dateNum}>{dateNum}</span>
          {dayMood ? (
            <span className={styles.moodEmoji} title={dayMood.label}>
              {dayMood.emoji}
            </span>
          ) : null}
          {dayJournal && !dayMood ? (
            <span className={styles.dotEntry} title="Journal entry">
              •
            </span>
          ) : null}
        </button>
      );
    }
    // Other dates: show mood emoji or dot if mood/journal, not interactive
    return (
      <div
        key={`date-${dateNum}`}
        className={styles.calendarCell}
        aria-label={`${MONTHS[month]} ${dateNum}${dayMood ? `. Mood: ${dayMood.label}` : ""}`}
        aria-disabled="true"
      >
        <span className={styles.dateNumOther}>{dateNum}</span>
        {/* Show emoji below number if mood recorded */}
        {dayMood ? (
          <span className={styles.moodEmoji} title={dayMood.label} style={{ display: "block" }}>
            {dayMood.emoji}
          </span>
        ) : dayJournal ? (
          <span className={styles.dotEntry} title="Journal entry">
            •
          </span>
        ) : null}
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
