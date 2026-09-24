import { Box } from '@rocket.chat/fuselage';
import { ModalProviderWithRegion } from '@rocket.chat/ui-client';
import { ConferenceChatNotShared, narrowRoomStyle } from '@rocket.chat/ui-conference';
import { lazy, Suspense } from 'react';

import ConferenceThreadChat from './ConferenceThreadChat';
import ConferenceThreadOverRoom from './ConferenceThreadOverRoom';
import ConferenceRoomError from './components/ConferenceRoomError';
import ConferenceRoomSkeleton from './components/ConferenceRoomSkeleton';
import { NotSubscribedToRoomError } from '../../lib/errors/NotSubscribedToRoomError';
import { RoomNotFoundError } from '../../lib/errors/RoomNotFoundError';
import { useOpenRoomById } from '../room/hooks/useOpenRoomById';

const RoomProvider = lazy(() => import('../room/providers/RoomProvider'));
const ChatProvider = lazy(() => import('../room/providers/ChatProvider'));
const MessageHighlightProvider = lazy(() => import('../room/MessageList/providers/MessageHighlightProvider'));
const Room = lazy(() => import('../room/Room'));
const RoomNotFound = lazy(() => import('../room/RoomNotFound'));

type ConferenceRoomPanelProps = {
	rid: string;
	/** Given, the panel is the call's thread rather than its room. */
	tmid?: string;
	/** A thread of this room to show over it, if one is open. */
	thread?: string;
	onCloseThread?: () => void;
	onEscape?: () => void;
};

const ConferenceRoomPanel = ({ rid, tmid, thread, onCloseThread, onEscape }: ConferenceRoomPanelProps) => {
	const { data, error, isSuccess, isError, isLoading, refetch } = useOpenRoomById(rid);

	/**
	 * What went wrong, told apart.
	 *
	 * A public room this participant has neither joined nor may preview is not a missing page, and is the one
	 * error `useOpenRoomById` raises here with a better answer than "room not found" — it is the same situation
	 * the server usually reports in advance through `chatAccess`, reached from the other end, such as a room that
	 * became unreadable while the panel was open. Anything that is neither of those is the request having failed,
	 * which says nothing about the room and must not be reported as its absence.
	 */
	const errorState = (() => {
		if (!isError) {
			return null;
		}

		if (error instanceof NotSubscribedToRoomError) {
			return <ConferenceChatNotShared />;
		}

		if (error instanceof RoomNotFoundError) {
			return <RoomNotFound />;
		}

		return <ConferenceRoomError onRetry={() => void refetch()} />;
	})();

	return (
		<Box className={narrowRoomStyle} display='flex' width='full' height='full'>
			<Suspense fallback={<ConferenceRoomSkeleton />}>
				{isLoading && <ConferenceRoomSkeleton />}
				{/* `embedded` is said to the room rather than to the layout: this is a room rendered inside a panel,
				    which is what the narrow composer and the missing header follow from. Not to be confused with the
				    embedded *layout*, which is Rocket.Chat inside another application — the room asks one question
				    and the provider answers it from either source. */}
				{isSuccess && (
					<RoomProvider rid={data.rid} embedded>
						{/* A region of the room's own, so a modal opened from here is rendered inside this provider
						    rather than at the window's root — which is what lets the thread be a thread rather than a
						    second copy of the room. */}
						<ModalProviderWithRegion>
							{tmid ? (
								<MessageHighlightProvider>
									<ChatProvider tmid={tmid}>
										<ConferenceThreadChat tmid={tmid} onEscape={onEscape} />
									</ChatProvider>
								</MessageHighlightProvider>
							) : (
								<Room />
							)}
							{thread && onCloseThread && <ConferenceThreadOverRoom tmid={thread} onClose={onCloseThread} />}
						</ModalProviderWithRegion>
					</RoomProvider>
				)}
				{errorState}
			</Suspense>
		</Box>
	);
};

export default ConferenceRoomPanel;
