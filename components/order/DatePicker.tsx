"use client";

// Inline month calendar for choosing the pickup/delivery day at checkout.
//
// Follows the WAI-ARIA date-grid pattern: one tab stop for the whole month
// (roving tabindex), arrow keys move by day/week, Home/End to the week's ends,
// PageUp/PageDown by month. Bookable days read as soft sage chips, the chosen
// day is solid sage, booked-up days are struck through (still focusable so a
// screen reader hears why), and days outside the booking window are muted.
// Days are YYYY-MM-DD strings, all math at UTC noon (see lib/fulfillment).

import { useEffect, useRef, useState } from "react";
import { addDays, dayDate, dayLabel, isoDate } from "@/lib/fulfillment";

export type DayStatus = "available" | "booked" | "closed";

type Props = {
  /** The chosen day (YYYY-MM-DD), if any. */
  value: string | null;
  onChange: (day: string) => void;
  /** First and last bookable days. */
  first: string;
  last: string;
  /** The shop's today, marked on the calendar. */
  today: string;
  /** Whether a day inside [first, last] can take this order. */
  status: (day: string) => DayStatus;
  /** Names the grid for assistive tech, e.g. "Pickup day". */
  label: string;
};

const WEEKDAYS = [
  ["S", "Sunday"],
  ["M", "Monday"],
  ["T", "Tuesday"],
  ["W", "Wednesday"],
  ["T", "Thursday"],
  ["F", "Friday"],
  ["S", "Saturday"],
] as const;

/** "2026-11-01" for any day in November 2026. */
function monthOf(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

/** The first of the month `n` months from `month`. */
function addMonths(month: string, n: number): string {
  const d = dayDate(month);
  d.setUTCMonth(d.getUTCMonth() + n, 1);
  return isoDate(d);
}

/** The same day-of-month `n` months on, clamped to that month's length. */
function shiftMonths(day: string, n: number): string {
  const target = addMonths(monthOf(day), n);
  const lastOfTarget = addDays(addMonths(target, 1), -1);
  const want = `${target.slice(0, 8)}${day.slice(8)}`;
  return want > lastOfTarget ? lastOfTarget : want;
}

function monthTitle(month: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(dayDate(month));
}

/** The month's days in weeks (Sunday first), padded with nulls. */
function monthWeeks(month: string): (string | null)[][] {
  const lead = dayDate(month).getUTCDay();
  const end = addMonths(month, 1);
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = month; d < end; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const clamp = (day: string, lo: string, hi: string) => (day < lo ? lo : day > hi ? hi : day);

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M12.5 15 7.5 10l5-5" : "M7.5 5l5 5-5 5"} />
    </svg>
  );
}

export default function DatePicker({ value, onChange, first, last, today, status, label }: Props) {
  const [month, setMonth] = useState(() => monthOf(value ?? first));
  // The day holding the grid's single tab stop.
  const [focusDay, setFocusDay] = useState(() => value ?? first);
  const keyboardMove = useRef(false);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  // Follow the chosen day when it changes from outside (e.g. moved to the new earliest day).
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (value) {
      setFocusDay(value);
      setMonth(monthOf(value));
    }
  }

  // The tab stop stays inside the bookable range (the range can shrink as the cutoff passes).
  const tabDay = clamp(focusDay, first, last);

  useEffect(() => {
    if (!keyboardMove.current) return;
    keyboardMove.current = false;
    buttons.current.get(tabDay)?.focus();
  }, [tabDay]);

  const firstMonth = monthOf(first);
  const lastMonth = monthOf(last);
  const canPrev = month > firstMonth;
  const canNext = month < lastMonth;

  function moveFocus(to: string) {
    const next = clamp(to, first, last);
    keyboardMove.current = true;
    setFocusDay(next);
    setMonth(monthOf(next));
  }

  function onKeyDown(e: React.KeyboardEvent, day: string) {
    const weekday = dayDate(day).getUTCDay();
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(day, -1),
      ArrowRight: () => addDays(day, 1),
      ArrowUp: () => addDays(day, -7),
      ArrowDown: () => addDays(day, 7),
      Home: () => addDays(day, -weekday),
      End: () => addDays(day, 6 - weekday),
      PageUp: () => shiftMonths(day, e.shiftKey ? -12 : -1),
      PageDown: () => shiftMonths(day, e.shiftKey ? 12 : 1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    moveFocus(move());
  }

  function goMonth(n: number) {
    const target = addMonths(month, n);
    setMonth(target);
    // Land the tab stop on the first bookable day of that month.
    let d = clamp(target, first, last);
    const end = addMonths(target, 1);
    while (d < end && d <= last && status(d) !== "available") d = addDays(d, 1);
    setFocusDay(d < end && d <= last ? d : clamp(target, first, last));
  }

  const weeks = monthWeeks(month);
  const titleId = `cal-title-${label.replace(/\W+/g, "-").toLowerCase()}`;
  const monthHasBooked = weeks.flat().some((d) => d && d >= first && d <= last && status(d) === "booked");

  return (
    <div className="w-full">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <h3 id={titleId} aria-live="polite" className="text-xl" style={{ color: "var(--charcoal)" }}>
          {monthTitle(month)}
        </h3>
        <div className="flex items-center gap-1">
          {(
            [
              [-1, "left", canPrev, "Previous month"],
              [1, "right", canNext, "Next month"],
            ] as const
          ).map(([n, dir, enabled, name]) => (
            <button
              key={dir}
              type="button"
              onClick={() => goMonth(n)}
              disabled={!enabled}
              aria-label={name}
              className="cal-nav w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            >
              <Chevron dir={dir} />
            </button>
          ))}
        </div>
      </div>

      {/* Month grid */}
      <table role="grid" aria-label={`${label}, ${monthTitle(month)}`} className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            {WEEKDAYS.map(([short, full], i) => (
              <th key={i} scope="col" abbr={full} className="pb-2 text-xs font-semibold" style={{ color: "var(--text-muted)", fontFamily: "var(--font-quicksand), sans-serif" }}>
                <span aria-hidden="true">{short}</span>
                <span className="sr-only">{full}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, i) => {
                if (!day) return <td key={i} />;
                const inRange = day >= first && day <= last;
                const s: DayStatus = inRange ? status(day) : "closed";
                const selected = day === value;
                const isToday = day === today;
                const note = s === "booked" ? ", booked up" : s === "closed" ? ", not available" : "";
                return (
                  <td key={day} aria-selected={selected} className="p-0.5 text-center">
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) buttons.current.set(day, el);
                        else buttons.current.delete(day);
                      }}
                      tabIndex={day === tabDay ? 0 : -1}
                      disabled={!inRange}
                      aria-disabled={s !== "available"}
                      aria-current={isToday ? "date" : undefined}
                      aria-label={`${dayLabel(day)}${isToday ? ", today" : ""}${note}`}
                      onClick={() => {
                        setFocusDay(day);
                        if (s === "available") onChange(day);
                      }}
                      onKeyDown={(e) => onKeyDown(e, day)}
                      data-status={s}
                      data-selected={selected || undefined}
                      className="cal-day relative mx-auto flex w-full max-w-11 aspect-square items-center justify-center rounded-full text-[0.95rem] transition-colors"
                    >
                      {Number(day.slice(8))}
                      {isToday && <span aria-hidden="true" className="cal-today absolute bottom-1 h-1 w-1 rounded-full" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {monthHasBooked && (
        <p className="mt-3 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span data-status="booked" className="cal-day inline-flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem]" aria-hidden="true">
            14
          </span>
          Booked up — try another day
        </p>
      )}
    </div>
  );
}
