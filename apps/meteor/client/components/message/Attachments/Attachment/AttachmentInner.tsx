import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const AttachmentInner: FC<ComponentProps<typeof Box>> = ({ ...props }) => <Box {...props} />;

export default AttachmentInner;
