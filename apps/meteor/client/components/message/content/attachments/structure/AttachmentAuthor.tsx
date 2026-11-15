import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AttachmentAuthorProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentAuthor = (props: AttachmentAuthorProps) => (
	<Box display='flex' flexDirection='row' alignItems='center' marginBlockEnd={4} {...props} />
);

export default AttachmentAuthor;
