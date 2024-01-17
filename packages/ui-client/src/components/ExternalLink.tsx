import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';

type ExternalLinkProps = {
	to: string;
} & ComponentProps<typeof Box>;

export const ExternalLink: FC<ExternalLinkProps> = ({ children, to, ...props }) => (
	<Box is='a' href={to} target='_blank' rel='noopener noreferrer' {...props}>
		{children || to}
	</Box>
);
