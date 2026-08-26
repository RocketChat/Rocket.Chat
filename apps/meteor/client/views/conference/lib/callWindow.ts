/** How long to let `window.close` take effect before assuming it was refused. */
const CLOSE_GRACE = 500;

/** The id that stands for a call that does not exist yet — the window opens before the conference is created. */
export const NEW_CONFERENCE_ID = 'new';

/**
 * Closes the call window.
 *
 * Three strategies, tried in order:
 *
 * 1. **Desktop app**: the Electron preload exposes `videoCallWindow.close()` on the renderer's `window`.
 *    `window.close()` does not reliably close a BrowserWindow that wasn't opened by `window.open()`, and
 *    the desktop app opens the conference window internally via `openInternalVideoChatWindow`.
 * 2. **Browser**: `window.close()` works when the window was opened by script (`window.open`).
 * 3. **Fallback**: navigate to `/home` so the user at least leaves the call.
 */
export const closeCallWindow = (): void => {
	if (window.videoCallWindow?.close) {
		window.videoCallWindow.close();
		return;
	}

	window.close();
	setTimeout(() => window.location.assign('/home'), CLOSE_GRACE);
};
