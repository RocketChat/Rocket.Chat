import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AttachmentAuthorTimestampProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentAuthorTimestamp = ({ href, ...props }: AttachmentAuthorTimestampProps) =>
	href ? <Box is='a' href={href} color='default' fontScale='c1' {...props} /> : <Box fontScale='c1' {...props} />;

export default AttachmentAuthorTimestamp;
