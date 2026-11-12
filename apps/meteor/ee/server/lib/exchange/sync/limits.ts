/**
 * How many mailboxes run at once and the maximum number of connections in the EWS pool. Kept low because neither
 * server tells us its request limit, and crossing it gets us throttled.
 */
export const MAILBOX_CONCURRENCY = 5;
