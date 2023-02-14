import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const AttachmentText: FC<ComponentProps<typeof Box>> = (props) => <Box mbe={4} mi={2} fontScale='p2' color='default' {...props}></Box>;

export default AttachmentText;
