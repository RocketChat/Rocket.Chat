import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

const AttachmentDescription = ({ ...props }: ComponentProps<typeof Box>): ReactElement => (
	<Box rcx-attachment__description data-qa-type='attachment-description' mbe={4} color='default' {...props} />
);

export default AttachmentDescription;
