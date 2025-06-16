import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AttachmentDetailsProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentDetails = (props: AttachmentDetailsProps) => (
	<Box rcx-attachment__details fontScale='p2' color='hint' bg='surface-tint' padding={16} {...props} />
);

export default AttachmentDetails;
