import { memo } from 'react';

import ComposerSkeleton from '../ComposerSkeleton';
import RoomComposer from './RoomComposer';

const RoomComposerSkeleton = () => (
	<RoomComposer>
		<ComposerSkeleton />
	</RoomComposer>
);
export default memo(RoomComposerSkeleton);
