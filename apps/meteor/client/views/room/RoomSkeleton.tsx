import type { ReactElement } from 'react';
import React from 'react';

import MessageListSkeleton from '../../components/message/list/MessageListSkeleton';
import HeaderSkeletonV2 from './Header/HeaderSkeleton';
import RoomComposerSkeleton from './composer/RoomComposer/RoomComposerSkeleton';
import RoomLayout from './layout/RoomLayout';

const RoomSkeleton = (): ReactElement => (
	<RoomLayout
		header={<HeaderSkeletonV2 />}
		body={
			<>
				<MessageListSkeleton />
				<RoomComposerSkeleton />
			</>
		}
	/>
);
export default RoomSkeleton;
