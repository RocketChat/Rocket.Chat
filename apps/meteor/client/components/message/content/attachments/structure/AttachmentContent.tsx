import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AttachmentContentProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentContent = (props: AttachmentContentProps) => <Box rcx-attachment__content width='full' mb={4} {...props} />;

export default AttachmentContent;
