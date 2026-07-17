import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type AttachmentTitleProps = {
	children?: ReactNode;
	href?: string;
	className?: ComponentProps<typeof Box>['className'];
};

const AttachmentTitle = ({ href, className, children }: AttachmentTitleProps) =>
	href ? (
		<Box is='a' href={href} target='_blank' withTruncatedText marginInline={2} fontScale='c1' className={className}>
			{children}
		</Box>
	) : (
		<Box withTruncatedText marginInline={2} fontScale='c1' color='hint' className={className}>
			{children}
		</Box>
	);

export default AttachmentTitle;
