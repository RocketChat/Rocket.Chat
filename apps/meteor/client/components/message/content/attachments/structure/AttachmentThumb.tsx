import { Box } from '@rocket.chat/fuselage';
import { Avatar } from '@rocket.chat/ui-avatar';
import type { FC } from 'react';
import React, { memo } from 'react';

const AttachmentThumb: FC<{ url: string }> = ({ url }) => (
	<Box mis={8}>
		<Avatar {...({ url, size: 'x48' } as any)} />
	</Box>
);

export default memo(AttachmentThumb);
