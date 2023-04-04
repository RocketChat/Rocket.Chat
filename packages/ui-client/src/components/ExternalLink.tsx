import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

type ExternalLinkProps = {
	to: string;
};

export const ExternalLink: FC<ExternalLinkProps> = ({ children, to, ...props }) => (
	<Box is='a' href={to} target='_blank' rel='noopener noreferrer' {...props}>
		{children || to}
	</Box>
);
