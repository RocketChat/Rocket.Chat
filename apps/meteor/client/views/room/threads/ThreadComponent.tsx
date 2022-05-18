import type { IRoom } from '@rocket.chat/core-typings';
import { useRoute } from '@rocket.chat/ui-contexts';
import React, { useCallback, ReactElement } from 'react';

import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import ThreadError from './ThreadError';
import ThreadSkeleton from './ThreadSkeleton';
import ThreadView from './ThreadView';
import { useThreadMessage } from './useThreadMessage';

type ThreadComponentProps = {
	mid: string;
	jump: string | undefined;
	room: IRoom;
	onBack: () => void;
};

const ThreadComponent = ({ mid, jump, room, onBack }: ThreadComponentProps): ReactElement => {
	const threadMessageQuery = useThreadMessage(mid);

	const channelRoute = useRoute(roomCoordinator.getRoomTypeConfig(room.t).route.name);
	const handleClose = useCallback(() => {
		channelRoute.push(room.t === 'd' ? { rid: room._id } : { name: room.name || room._id });
	}, [channelRoute, room._id, room.t, room.name]);

	if (threadMessageQuery.isIdle || threadMessageQuery.isLoading) {
		return <ThreadSkeleton onBack={onBack} onClose={handleClose} />;
	}

	if (threadMessageQuery.isError) {
		return (
			<ThreadError
				reloading={threadMessageQuery.isRefetching}
				onReload={threadMessageQuery.refetch}
				onBack={onBack}
				onClose={handleClose}
			/>
		);
	}

	return (
		<ErrorBoundary fallback={<ThreadError onReload={threadMessageQuery.refetch} onBack={onBack} onClose={handleClose} />}>
			<ThreadView message={threadMessageQuery.data} jump={jump} onBack={onBack} onClose={handleClose} />
		</ErrorBoundary>
	);
};

export default ThreadComponent;
