import { Box, InputBox } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const ComposerSkeleton: FC = () => (
	<Box pi='x24' pb='x16' display='flex'>
		<InputBox.Skeleton />
	</Box>
);
export default memo(ComposerSkeleton);
