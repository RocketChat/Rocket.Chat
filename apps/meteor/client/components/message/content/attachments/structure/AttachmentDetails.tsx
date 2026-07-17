import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AttachmentDetailsProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentDetails = (props: AttachmentDetailsProps) => (
	<Box rcx-attachment__details fontScale='p2' color='default' backgroundColor='surface-tint' padding={16} {...props} />
);

export default AttachmentDetails;
