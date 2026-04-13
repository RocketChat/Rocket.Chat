import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type ExternalLinkProps = {
	to: string;
} & ComponentPropsWithoutRef<typeof Box>;

export const ExternalLink = ({ children, to, ...props }: ExternalLinkProps) => (
	<Box is='a' href={to} target='_blank' rel='noopener noreferrer' {...props}>
		{children || to}
	</Box>
);
