import { Box, InputBox } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { memo } from 'react';

const ComposerSkeleton: FC = () => (
	<Box padding={24} display='flex'>
		<InputBox.Skeleton height={52} />
	</Box>
);
export default memo(ComposerSkeleton);
