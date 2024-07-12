import { Box, Avatar } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

type AttachmentThumbProps = { url: string };

const AttachmentThumb = ({ url }: AttachmentThumbProps) => (
	<Box mis={8}>
		<Avatar {...({ url, size: 'x48' } as any)} />
	</Box>
);

export default memo(AttachmentThumb);
