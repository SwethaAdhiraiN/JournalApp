import React, { useState } from "react";
import styles from "./CalendarPage.module.css";

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

// CalendarPage: Fullscreen calendar as described
// PUBLIC_INTERFACE
function CalendarPage() {
  /**
   * Fullscreen interactive calendar with today's cell clickable for mood/journal entry.
   * Design per assets/calendar_design_notes.md. Uses provided palette.
   */
  const today = getToday();
  const year = today.year;
  const month = today.month;
  const monthLabel = MONTHS[month] + " " + year;
  const calendarWeeks = getMonthDays(year, month);

  const [mood, setMood] = useState(null); // {label,emoji}
  const [journal, setJournal] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [tempMood, setTempMood] = useState(null);
  const [tempJournal, setTempJournal] = useState("");

  // Open modal when user clicks today
  function handleTodayClick() {
    setTempMood(mood);
    setTempJournal(journal);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleSave() {
    setMood(tempMood);
    setJournal(tempJournal.trim());
    setModalOpen(false);
  }

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
      dateNum === today.date &&
      month === today.month &&
      year === today.year;

    if (isToday) {
      return (
        <button
          key={`today-${dateNum}`}
          className={`${styles.calendarCell} ${styles.todayCell} ${
            modalOpen ? styles.activeCell : ""
          }`}
          aria-current="date"
          aria-label={`Today, ${MONTHS[month]} ${dateNum}${
            mood ? `. Mood selected: ${mood.label}` : ""
          }`}
          tabIndex={0}
          type="button"
          onClick={handleTodayClick}
        >
          <span className={styles.dateNum}>{dateNum}</span>
          {mood ? (
            <span className={styles.moodEmoji} title={mood.label}>
              {mood.emoji}
            </span>
          ) : null}
          {journal && !mood ? (
            <span className={styles.dotEntry} title="Journal entry">
              •
            </span>
          ) : null}
        </button>
      );
    }
    // Other dates: not interactive
    return (
      <div
        key={`date-${dateNum}`}
        className={styles.calendarCell}
        aria-label={`${MONTHS[month]} ${dateNum}`}
        aria-disabled="true"
      >
        <span className={styles.dateNumOther}>{dateNum}</span>
      </div>
    );
  }

  return (
    <div className={styles.calendarRoot} aria-label="Journal mood calendar">
      <div className={styles.calendarContainer}>
        <header
          className={styles.calendarHeader}
          aria-label={`${MONTHS[month]} ${year}`}
        >
          <span className={styles.monthLabel}>{monthLabel}</span>
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
            week.map((dateNum, didx) =>
              renderDayCell(dateNum, widx, didx)
            )
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
              <span className={styles.journalIcon} title="Journal entry">📝</span>
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
            <h2 className={styles.modalTitle}>
              How are you feeling today?
            </h2>
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
                  <span role="img" aria-label={m.label} style={{ fontSize: "2rem" }}>
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
