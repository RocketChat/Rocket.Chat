import { ListSkeleton } from '@rocket.chat/ui-client';

import HeaderSkeleton from './Header/HeaderSkeleton';
import RoomComposerSkeleton from './composer/RoomComposer/RoomComposerSkeleton';
import RoomLayout from './layout/RoomLayout';

const RoomSkeleton = () => (
	<RoomLayout
		header={<HeaderSkeleton />}
		body={
			<>
				<ListSkeleton />
				<RoomComposerSkeleton />
			</>
		}
	/>
);
export default RoomSkeleton;
