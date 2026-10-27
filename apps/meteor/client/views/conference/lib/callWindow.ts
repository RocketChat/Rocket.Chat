import type { IVideoCallWindow } from '@rocket.chat/desktop-api';

import { _relativeToSiteRootUrl } from '../../../lib/absoluteUrl';

/** How long to let `window.close` take effect before assuming it was refused. */
const CLOSE_GRACE = 500;

/** The id that stands for a call that does not exist yet — the window opens before the conference is created. */
export const NEW_CONFERENCE_ID = 'new';

/**
 * The desktop app's bridge for its video call window, where it has one: under `RocketChatDesktop` since desktop
 * 4.18, and a global of its own before that.
 */
const desktopCallWindow = (): IVideoCallWindow | undefined => window.RocketChatDesktop?.videoCall ?? window.videoCallWindow;

/**
 * Closes the call window.
 *
 * Three strategies, tried in order:
 *
 * 1. **Desktop app**: the desktop app's preload exposes a `close()` for its video call window.
 *    `window.close()` does not reliably close a BrowserWindow that wasn't opened by `window.open()`, and
 *    the desktop app opens the conference window internally via `openInternalVideoChatWindow`.
 * 2. **Browser**: `window.close()` works when the window was opened by script (`window.open`).
 * 3. **Fallback**: navigate to `/home` so the user at least leaves the call. Through the site root, because a
 *    workspace served under `ROOT_URL_PATH_PREFIX` has no `/home` at the origin — that address is another
 *    application's, or a 404.
 */
export const closeCallWindow = (): void => {
	const desktop = desktopCallWindow();

	if (desktop?.close) {
		desktop.close();
		return;
	}

	window.close();
	setTimeout(() => window.location.assign(_relativeToSiteRootUrl('/home')), CLOSE_GRACE);
};
