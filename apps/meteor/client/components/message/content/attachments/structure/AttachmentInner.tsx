import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import React from 'react';

type AttachmentInnerProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentInner = (props: AttachmentInnerProps) => <Box {...props} />;

export default AttachmentInner;
