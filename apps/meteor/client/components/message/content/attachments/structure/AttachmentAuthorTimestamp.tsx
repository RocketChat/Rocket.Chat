import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AttachmentAuthorTimestampProps = { children?: ReactNode; href?: string };

const AttachmentAuthorTimestamp = ({ href, children }: AttachmentAuthorTimestampProps) =>
	href ? (
		<Box is='a' href={href} color='default' fontScale='c1'>
			{children}
		</Box>
	) : (
		<Box fontScale='c1'>{children}</Box>
	);

export default AttachmentAuthorTimestamp;
