import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const AttachmentAuthor: FC<ComponentProps<typeof Box>> = (props) => (
	<Box display='flex' flexDirection='row' alignItems='center' mbe='x4' {...props} />
);

export default AttachmentAuthor;
