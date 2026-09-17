import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AttachmentRowProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentRow = (props: AttachmentRowProps) => (
	<Box marginInline={-2} marginBlockEnd={2} rcx-message-attachment display='flex' alignItems='center' {...props} />
);

export default AttachmentRow;
