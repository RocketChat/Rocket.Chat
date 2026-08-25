// Shared by the scheduling UI and the server so both agree on which dates are acceptable.
// The dispatcher runs every minute, so a shorter lead time would be delivered late.
export const MIN_SCHEDULING_LEAD_MS = 60 * 1000;

export const MAX_SCHEDULING_HORIZON_MS = 365 * 24 * 60 * 60 * 1000;
