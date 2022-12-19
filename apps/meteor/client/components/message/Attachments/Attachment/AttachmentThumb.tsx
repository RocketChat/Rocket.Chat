import { Box, Avatar } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React, { memo } from 'react';

const AttachmentThumb: FC<{ url: string }> = ({ url }) => (
	<Box mis='x8'>
		<Avatar {...({ url, size: 'x48' } as any)} />
	</Box>
);

export default memo(AttachmentThumb);
