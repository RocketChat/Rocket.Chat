import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { LayoutContext, useLayout } from '@rocket.chat/ui-contexts';
import { lazy, Suspense, useMemo } from 'react';

import ConferenceThreadChat from './ConferenceThreadChat';
import { NotAuthorizedError } from '../../lib/errors/NotAuthorizedError';
import RoomSkeleton from '../room/RoomSkeleton';
import { useOpenRoomById } from '../room/hooks/useOpenRoomById';

const RoomProvider = lazy(() => import('../room/providers/RoomProvider'));
const ChatProvider = lazy(() => import('../room/providers/ChatProvider'));
const RoomNotFound = lazy(() => import('../room/RoomNotFound'));
const NotAuthorizedPage = lazy(() => import('../notAuthorized/NotAuthorizedPage'));

const PANEL_INLINE_PADDING = 12;

const narrowRoomStyle = css`
	& .rc-message-box.embedded {
		padding-inline: ${PANEL_INLINE_PADDING}px;
	}

	& .rcx-message {
		padding-left: ${PANEL_INLINE_PADDING}px;
	}

	& .rcx-message-system {
		padding-left: ${PANEL_INLINE_PADDING}px;
	}

	& .rcx-message-container--left {
		margin-left: 0px;
	}
`;

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
					{isError && (error instanceof NotAuthorizedError ? <NotAuthorizedPage /> : <RoomNotFound />)}
				</Suspense>
			</Box>
		</LayoutContext.Provider>
	);
};

export default ConferenceThread;
