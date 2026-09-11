import { Box } from '@rocket.chat/fuselage';
import { LayoutContext, useLayout } from '@rocket.chat/ui-contexts';
import { lazy, Suspense, useMemo } from 'react';

import ConferenceThreadChat from './ConferenceThreadChat';
import ConferenceChatNotShared from './components/ConferenceChatNotShared';
import { narrowRoomStyle } from './panelStyles';
import { NotSubscribedToRoomError } from '../../lib/errors/NotSubscribedToRoomError';
import RoomSkeleton from '../room/RoomSkeleton';
import { useOpenRoomById } from '../room/hooks/useOpenRoomById';

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
