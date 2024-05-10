import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const AttachmentInner: FC<ComponentProps<typeof Box>> = ({ ...props }) => <Box {...props} />;

export default AttachmentInner;
