import { css } from '@rocket.chat/css-in-js';

export const PANEL_INLINE_PADDING = 12;

/**
 * Marks the parts of the window that keep following the reader's appearance preference. The window is pinned
 * dark; what the panels carry is room UI. Paired with the style tag that gives the class its palette.
 */
export const CONFERENCE_THEMED_CLASS = 'conference-themed';

/**
 * Reclaims horizontal space for the narrow conference panel, scoped to whichever subtree applies it so the
 * room's own appearance and external `?layout=embedded` embeds are untouched.
 *
 * Only the *start* padding is trimmed: the message toolbar and the timestamp column sit against the end and
 * need the room. Logical properties throughout, or RTL loses space from the side content is read towards.
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
