import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AttachmentAuthorProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentAuthor = (props: AttachmentAuthorProps) => (
	<Box display='flex' flexDirection='row' alignItems='center' marginBlockEnd='x4' gap='x4' {...props} />
);

export default AttachmentAuthor;
