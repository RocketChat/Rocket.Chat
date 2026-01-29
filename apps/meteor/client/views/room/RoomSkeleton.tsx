import type { ReactElement } from 'react';

import HeaderSkeleton from './Header/HeaderSkeleton';
import RoomComposerSkeleton from './composer/RoomComposer/RoomComposerSkeleton';
import RoomLayout from './layout/RoomLayout';
import MessageListSkeleton from '../../components/message/list/MessageListSkeleton';

const RoomSkeleton = (): ReactElement => (
	<RoomLayout
		header={<HeaderSkeleton />}
		body={
			<>
				<MessageListSkeleton />
				<RoomComposerSkeleton />
			</>
		}
	/>
);
export default RoomSkeleton;
