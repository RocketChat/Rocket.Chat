import type { ReactElement } from 'react';

import HeaderSkeleton from './Header/HeaderSkeleton';
import RoomComposerSkeleton from './composer/RoomComposer/RoomComposerSkeleton';
import RoomLayout from './layout/RoomLayout';
import ListSkeleton from '../../components/ListSkeleton';

const RoomSkeleton = (): ReactElement => (
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
