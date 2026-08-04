/** How long to let `window.close` take effect before assuming it was refused. */
const CLOSE_GRACE = 500;

/** The id that stands for a call that does not exist yet — the window opens before the conference is created. */
export const NEW_CONFERENCE_ID = 'new';

/**
 * Closes the call window.
 *
 * `window.close` only works on a window that was opened by script, which the call window is — but a conference
 * reached by pasting the URL isn't, and there is no synchronous way to tell whether the close took. So give it a
 * moment, then fall back to leaving the page, which gets the user out of the call either way.
 */
export const closeCallWindow = (): void => {
	window.close();
	setTimeout(() => window.location.assign('/home'), CLOSE_GRACE);
};
