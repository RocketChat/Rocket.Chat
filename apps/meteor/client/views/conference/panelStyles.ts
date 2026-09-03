import { css } from '@rocket.chat/css-in-js';

export const PANEL_INLINE_PADDING = 12;

/**
 * Marks the parts of the conference window that keep following the reader's appearance preference.
 *
 * The window itself is pinned dark — a call surface is dark wherever calls are — but what the panels beside the
 * call carry is room UI: a chat, a members list, a thread. Those are read the way the reader reads the rest of
 * Rocket.Chat, so this class is where the preference is put back, as a palette scoped to whatever wears it.
 *
 * One constant rather than a literal in each place, because the class and the style tag that gives it a palette
 * only work as a pair.
 */
export const CONFERENCE_THEMED_CLASS = 'conference-themed';

/**
 * Reclaims horizontal space for the narrow conference panel. Everything here is scoped to whichever subtree
 * applies it, so the room's normal full-width appearance and every external `?layout=embedded` embed are
 * untouched.
 *
 * - The composer: opting into the embedded layout zeroes its inline padding, which is sized for the tiny
 *   `?layout=embedded` iframe where every pixel counts. In a panel that just reads as text jammed against
 *   the edges, so restore it — matched to the panel header's own padding.
 * - Messages: the default 20px start padding plus the avatar gutter's own start margin spends more of a
 *   400px panel on empty space than the panel can spare. Trimming the start padding and dropping that
 *   margin gives the message content the difference back.
 *
 * Only the *start* padding is trimmed — the end padding is left alone, since the message toolbar and the
 * timestamp/status column sit against it and need the room.
 *
 * Logical properties throughout: the physical `padding-left`/`margin-left` these started as trimmed the wrong
 * edge under RTL, taking space from the side the content is read towards and leaving the crowded side crowded.
 *
 * Shared by the chat panel and the thread panel, which want the same room for the same reason — two copies of
 * it drifted the moment either was adjusted.
 */
export const narrowRoomStyle = css`
	& .rc-message-box.embedded {
		padding-inline: ${PANEL_INLINE_PADDING}px;
	}

	& .rcx-message {
		padding-inline-start: ${PANEL_INLINE_PADDING}px;
	}

	& .rcx-message-system {
		padding-inline-start: ${PANEL_INLINE_PADDING}px;
	}

	& .rcx-message-container--left {
		margin-inline-start: 0px;
	}
`;
