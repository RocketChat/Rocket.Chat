import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';
import React from 'react';

const AttachmentAuthorName: FC<ComponentProps<typeof Box>> = (props) => <Box withTruncatedText fontScale='p2m' mi={8} {...props} />;

export default AttachmentAuthorName;
