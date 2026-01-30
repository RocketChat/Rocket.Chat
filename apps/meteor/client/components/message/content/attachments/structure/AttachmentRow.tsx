import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AttachmentRowProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentRow = (props: AttachmentRowProps) => (
	<Box mi={-2} mbe={2} rcx-message-attachment display='flex' alignItems='center' {...props} />
);

export default AttachmentRow;
