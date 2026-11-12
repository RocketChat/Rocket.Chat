/**
 * How many mailboxes run at once and the maximum number of connections in the EWS pool. Kept low because neither
 * server tells us its request limit, and crossing it gets us throttled.
 */
export const MAILBOX_CONCURRENCY = 5;

/** Busy presence refreshes at once after a calendar run. They never reach Exchange, so its throttling does not bound them. */
export const PRESENCE_REFRESH_CONCURRENCY = 10;
