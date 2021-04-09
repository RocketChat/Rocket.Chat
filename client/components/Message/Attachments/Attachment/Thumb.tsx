import { Box, Avatar } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const Thumb: FC<{ url: string }> = ({ url }) => (
	<Box mis='x8'>
		<Avatar {...({ url, size: 'x48' } as any)} />
	</Box>
);

export default memo(Thumb);
