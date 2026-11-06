import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AttachmentContentProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentContent = (props: AttachmentContentProps) => <Box rcx-attachment__content width='full' marginBlock={4} {...props} />;

export default AttachmentContent;
