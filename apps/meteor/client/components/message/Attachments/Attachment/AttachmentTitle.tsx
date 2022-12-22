import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const AttachmentTitle: FC<ComponentProps<typeof Box>> = (props) => (
	<Box withTruncatedText mi='x2' fontScale='c1' color='hint' {...props}></Box>
);

export default AttachmentTitle;
