import type { IRoom } from '@rocket.chat/core-typings';
import { useRoute } from '@rocket.chat/ui-contexts';
import React, { useCallback, ReactElement, MouseEvent } from 'react';

import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import ThreadSkeleton from './ThreadSkeleton';
import ThreadView from './ThreadView';
import { useThreadExpansion } from './useThreadExpansion';
import { useThreadMessage } from './useThreadMessage';

type ThreadComponentProps = {
	mid: string;
	jump: string | undefined;
	room: IRoom;
	onClickBack: (e: MouseEvent<HTMLOrSVGElement>) => void;
};

const ThreadComponent = ({ mid, jump, room, onClickBack }: ThreadComponentProps): ReactElement => {
	const threadMessageQuery = useThreadMessage(mid);

	const [canExpand, expanded, toggleExpanded] = useThreadExpansion();

	const channelRoute = useRoute(roomCoordinator.getRoomTypeConfig(room.t).route.name);
	const handleClose = useCallback(() => {
		channelRoute.push(room.t === 'd' ? { rid: room._id } : { name: room.name || room._id });
	}, [channelRoute, room._id, room.t, room.name]);

	if (threadMessageQuery.isIdle || threadMessageQuery.isLoading) {
		return <ThreadSkeleton expanded={canExpand && expanded} onClose={handleClose} />;
	}

	if (threadMessageQuery.isError) {
		// TODO: view for thread fetch errored
		return <ThreadSkeleton expanded={canExpand && expanded} onClose={handleClose} />;
	}

	return (
		<ThreadView
			message={threadMessageQuery.data}
			jump={jump}
			canExpand={canExpand}
			expanded={expanded}
			onToggleExpand={toggleExpanded}
			onClose={handleClose}
			onClickBack={onClickBack}
		/>
	);
};

export default ThreadComponent;
