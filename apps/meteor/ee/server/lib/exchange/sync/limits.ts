/**
 * How many mailboxes at once. Kept low because neither server tells us its request limit, and crossing it
 * gets us throttled. Raising it does not speed up EWS: that transport talks to Exchange one call at a time.
 */
export const MAILBOX_CONCURRENCY = 5;
