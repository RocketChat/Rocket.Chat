import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { LayoutContext, useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { lazy, Suspense, useMemo } from 'react';

import { NotAuthorizedError } from '../../lib/errors/NotAuthorizedError';
import RoomSkeleton from '../room/RoomSkeleton';
import { useOpenRoomById } from '../room/hooks/useOpenRoomById';

const RoomProvider = lazy(() => import('../room/providers/RoomProvider'));
const Room = lazy(() => import('../room/Room'));
const RoomNotFound = lazy(() => import('../room/RoomNotFound'));
const NotAuthorizedPage = lazy(() => import('../notAuthorized/NotAuthorizedPage'));

type ConferenceRoomProps = {
	rid: string;
};

const PANEL_INLINE_PADDING = 12;

/**
 * Reclaims horizontal space for the narrow conference panel. Everything here is scoped to this subtree, so
 * the room's normal full-width appearance and every external `?layout=embedded` embed are untouched.
 *
 * - The composer: opting into the embedded layout zeroes its inline padding, which is sized for the tiny
 *   `?layout=embedded` iframe where every pixel counts. In a panel that just reads as text jammed against
 *   the edges, so restore it — matched to the panel header's own padding.
 * - Messages: the default 20px start padding plus the avatar gutter's own left margin spends more of a
 *   400px panel on empty space than the panel can spare. Trimming the start padding and dropping that
 *   margin gives the message content the difference back.
 *
 * Only the *start* padding is trimmed — the end padding is left alone, since the message toolbar and the
 * timestamp/status column sit against it and need the room.
 */
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

const ConferenceRoom = ({ rid }: ConferenceRoomProps): ReactElement => {
	const { data, error, isSuccess, isError, isLoading } = useOpenRoomById(rid);
	const layoutContext = useLayout();
	// The room renders inside a narrow panel next to the call, so force the embedded layout.
	const layoutContextEmbedded = useMemo(() => ({ ...layoutContext, isEmbedded: true }), [layoutContext]);

	// Keeping this room's subscription fresh is the page's job, not this panel's — see
	// `useConferenceSubscription`. It has to outlive the panel, because the closed chat's unread badge needs it.

	return (
		<LayoutContext.Provider value={layoutContextEmbedded}>
			<Box className={narrowRoomStyle} display='flex' width='full' height='full'>
				<Suspense fallback={<RoomSkeleton />}>
					{isLoading && <RoomSkeleton />}
					{isSuccess && (
						<RoomProvider rid={data.rid}>
							<Room />
						</RoomProvider>
					)}
					{isError && (error instanceof NotAuthorizedError ? <NotAuthorizedPage /> : <RoomNotFound />)}
				</Suspense>
			</Box>
		</LayoutContext.Provider>
	);
};

export default ConferenceRoom;
