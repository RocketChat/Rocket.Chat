import type { FC } from 'react';
import React, { memo } from 'react';

import ComposerSkeleton from '../ComposerSkeleton';
import RoomComposer from './RoomComposer';

const RoomComposerSkeleton: FC = () => (
	<RoomComposer>
		<ComposerSkeleton />
	</RoomComposer>
);
export default memo(RoomComposerSkeleton);
