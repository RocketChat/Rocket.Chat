import { Box } from '@rocket.chat/fuselage';
import { LayoutContext, useLayout } from '@rocket.chat/ui-contexts';
import { lazy, Suspense, useMemo } from 'react';

import ConferenceChatNotShared from './ConferenceChatNotShared';
import ConferenceThreadChat from './ConferenceThreadChat';
import { narrowRoomStyle } from './panelStyles';
import { NotSubscribedToRoomError } from '../../lib/errors/NotSubscribedToRoomError';
import RoomSkeleton from '../room/RoomSkeleton';
import { useOpenRoomById } from '../room/hooks/useOpenRoomById';

const RoomProvider = lazy(() => import('../room/providers/RoomProvider'));
const ChatProvider = lazy(() => import('../room/providers/ChatProvider'));
const RoomNotFound = lazy(() => import('../room/RoomNotFound'));

type ConferenceThreadProps = {
	rid: string;
	tmid: string;
	onEscape?: () => void;
};

const ConferenceThread = ({ rid, tmid, onEscape }: ConferenceThreadProps) => {
	const { data, error, isSuccess, isError, isLoading } = useOpenRoomById(rid);
	const layoutContext = useLayout();
	const layoutContextEmbedded = useMemo(() => ({ ...layoutContext, isEmbedded: true }), [layoutContext]);

	return (
		<LayoutContext.Provider value={layoutContextEmbedded}>
			<Box className={narrowRoomStyle} display='flex' width='full' height='full'>
				<Suspense fallback={<RoomSkeleton />}>
					{isLoading && <RoomSkeleton />}
					{isSuccess && (
						<RoomProvider rid={data.rid}>
							<ChatProvider tmid={tmid}>
								<ConferenceThreadChat tmid={tmid} onEscape={onEscape} />
							</ChatProvider>
						</RoomProvider>
					)}
					{isError && (error instanceof NotSubscribedToRoomError ? <ConferenceChatNotShared /> : <RoomNotFound />)}
				</Suspense>
			</Box>
		</LayoutContext.Provider>
	);
};

export default ConferenceThread;
