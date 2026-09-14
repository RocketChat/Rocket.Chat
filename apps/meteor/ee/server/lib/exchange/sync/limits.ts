/**
 * How many pages to follow before giving up on a provider that never says it is done. Shared, because the
 * calendar window and a contact folder are read with the same paging contract.
 */
export const MAX_PAGES = 50;

/**
 * How many mailboxes at once. Kept low because neither server tells us its request limit, and crossing it
 * gets us throttled. Raising it does not speed up EWS: that transport talks to Exchange one call at a time.
 */
export const MAILBOX_CONCURRENCY = 5;
