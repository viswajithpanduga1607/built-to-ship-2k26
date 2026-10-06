import { clsx } from 'clsx'

/**
 * Utility to conditionally join classNames.
 * Wraps clsx for a familiar cn() API.
 */
export function cn(...inputs) {
  return clsx(inputs)
}

/**
 * Format a date string for display.
 * @param {string} dateStr - ISO date string (e.g., "2026-10-15")
 * @returns {string} - Formatted date (e.g., "Oct 15, 2026")
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

/**
 * Calculate duration in days between two date strings.
 * @param {string} start
 * @param {string} end
 * @returns {number}
 */
export function daysBetween(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1)
}

/**
 * Format a timestamp for display (relative or absolute).
 * @param {string} ts - ISO timestamp
 * @returns {string}
 */
export function formatTimestamp(ts) {
  if (!ts) return '—'
  const date = new Date(ts)
  const now  = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Get initials from a full name.
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Urgency level → style config
 */
export const URGENCY_CONFIG = {
  Low:    { color: 'text-emerald-400', bg: 'bg-emerald-500/12 border-emerald-500/25', dot: 'bg-emerald-400' },
  Medium: { color: 'text-amber-400',   bg: 'bg-amber-500/12 border-amber-500/25',   dot: 'bg-amber-400' },
  High:   { color: 'text-rose-400',    bg: 'bg-rose-500/12 border-rose-500/25',    dot: 'bg-rose-400' },
}

/**
 * Request type → icon name mapping
 */
export const REQUEST_TYPE_CONFIG = {
  'PTO':         { label: 'PTO',         icon: 'Palmtree',      color: 'text-cyan-400' },
  'Sick Leave':  { label: 'Sick Leave',  icon: 'Stethoscope',   color: 'text-rose-400' },
  'Remote Work': { label: 'Remote Work', icon: 'Laptop',        color: 'text-violet-400' },
  'Equipment':   { label: 'Equipment',   icon: 'Monitor',       color: 'text-amber-400' },
}
