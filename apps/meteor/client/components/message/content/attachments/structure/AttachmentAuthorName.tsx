import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type AttachmentAuthorNameProps = { children?: ReactNode; href?: string };

const AttachmentAuthorName = ({ href, children }: AttachmentAuthorNameProps) =>
	href ? (
		<Box is='a' href={href} target='_blank' withTruncatedText fontScale='p2m' marginInline={8}>
			{children}
		</Box>
	) : (
		<Box withTruncatedText fontScale='p2m' marginInline={8}>
			{children}
		</Box>
	);

export default AttachmentAuthorName;
