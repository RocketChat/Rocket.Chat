import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AttachmentRowProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentRow = (props: AttachmentRowProps) => (
	<Box marginBlockEnd={2} rcx-message-attachment display='flex' alignItems='center' gap='x4' {...props} />
);

export default AttachmentRow;
