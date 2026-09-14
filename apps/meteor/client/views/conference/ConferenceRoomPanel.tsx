import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { LayoutContext, useLayout } from '@rocket.chat/ui-contexts';
import { lazy, Suspense, useMemo } from 'react';

import ConferenceThreadChat from './ConferenceThreadChat';
import ConferenceChatNotShared from './components/ConferenceChatNotShared';
import { PANEL_INLINE_PADDING } from './panelStyles';
import { NotSubscribedToRoomError } from '../../lib/errors/NotSubscribedToRoomError';
import RoomSkeleton from '../room/RoomSkeleton';
import { useOpenRoomById } from '../room/hooks/useOpenRoomById';

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
 * Worn by both of this file's panels — the chat and the thread — which want the same room for the same
 * reason; two copies of it drifted the moment either was adjusted.
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

const RoomProvider = lazy(() => import('../room/providers/RoomProvider'));
const ChatProvider = lazy(() => import('../room/providers/ChatProvider'));
const Room = lazy(() => import('../room/Room'));
const RoomNotFound = lazy(() => import('../room/RoomNotFound'));

type ConferenceRoomPanelProps = {
	rid: string;
	/** Given, the panel is the call's thread rather than its room. */
	tmid?: string;
	onEscape?: () => void;
};

/**
 * The call's chat, rendered in the panel beside it: the room, or one thread of it.
 *
 * Which of the two it is only decides what goes inside the room provider. Everything around that is the same
 * either way — the room has to be opened, the layout has to be told it is embedded so the room UI fits a narrow
 * panel, and the same three outcomes have to be drawn while and after it loads.
 *
 * Keeping this room's subscription fresh is the page's job, not this panel's — see `useConferenceSubscription`.
 * It has to outlive the panel, because the closed chat's unread badge needs it.
 */
const ConferenceRoomPanel = ({ rid, tmid, onEscape }: ConferenceRoomPanelProps) => {
	const { data, error, isSuccess, isError, isLoading } = useOpenRoomById(rid);
	const layoutContext = useLayout();
	// The room renders inside a narrow panel next to the call, so force the embedded layout.
	const layoutContextEmbedded = useMemo(() => ({ ...layoutContext, isEmbedded: true }), [layoutContext]);

	return (
		<LayoutContext.Provider value={layoutContextEmbedded}>
			<Box className={narrowRoomStyle} display='flex' width='full' height='full'>
				<Suspense fallback={<RoomSkeleton />}>
					{isLoading && <RoomSkeleton />}
					{isSuccess && (
						<RoomProvider rid={data.rid}>
							{tmid ? (
								<ChatProvider tmid={tmid}>
									<ConferenceThreadChat tmid={tmid} onEscape={onEscape} />
								</ChatProvider>
							) : (
								<Room />
							)}
						</RoomProvider>
					)}
					{/* A public room this user has neither joined nor may preview: not a missing page, and the one error
					    `useOpenRoomById` raises here that has a better answer than "room not found". It is the same
					    situation the server usually reports in advance through `chatAccess`, reached from the other end —
					    a room that became unreadable while the panel was open, say. */}
					{isError && (error instanceof NotSubscribedToRoomError ? <ConferenceChatNotShared /> : <RoomNotFound />)}
				</Suspense>
			</Box>
		</LayoutContext.Provider>
	);
};

export default ConferenceRoomPanel;
