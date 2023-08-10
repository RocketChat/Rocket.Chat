import type { FC } from 'react';
import React, { memo } from 'react';

import ComposerSkeleton from '../composer/ComposerSkeleton';

const RoomFooterSkeleton: FC = () => (
	<footer className='rc-message-box footer'>
		<ComposerSkeleton />
	</footer>
);
export default memo(RoomFooterSkeleton);
