import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AttachmentInnerProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentInner = (props: AttachmentInnerProps) => <Box {...props} />;

export default AttachmentInner;
