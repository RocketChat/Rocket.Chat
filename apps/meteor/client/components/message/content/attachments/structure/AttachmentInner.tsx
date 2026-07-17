import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AttachmentInnerProps = { children?: ReactNode };

const AttachmentInner = ({ children }: AttachmentInnerProps) => <Box>{children}</Box>;

export default AttachmentInner;
