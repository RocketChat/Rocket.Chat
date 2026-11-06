/**
 * How many mailboxes run at once and the maximum number of connections in the EWS pool. Kept low because neither
 * server tells us its request limit, and crossing it gets us throttled.
 */
export const MAILBOX_CONCURRENCY = 5;

/** Photos above this are skipped rather than stored. */
export const MAX_CONTACT_PHOTO_BYTES = 500 * 1024;

/**
 * Photo deletes are one round trip each on every backend but the local ones, so a folder prune would
 * otherwise run them in single file.
 */
export const AVATAR_DELETE_CONCURRENCY = 5;
