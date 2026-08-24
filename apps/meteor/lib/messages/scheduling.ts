/**
 * Bounds shared by the scheduling UI and the server, so both agree on which dates are acceptable.
 */

/**
 * The dispatcher runs every minute, so anything closer than that would be delivered "late" from the
 * user's point of view. Requiring a small lead time makes the delivery window predictable.
 */
export const MIN_SCHEDULING_LEAD_MS = 60 * 1000;

/** Messages cannot be scheduled further away than this — keeps the pending list bounded and meaningful. */
export const MAX_SCHEDULING_HORIZON_MS = 365 * 24 * 60 * 60 * 1000;
