import React, { FC } from 'react';

type ExternalLinkProps = {
	to: string;
};

const ExternalLink: FC<ExternalLinkProps> = ({ children, to, ...props }) =>
	<a href={to} target='_blank' rel='noopener noreferrer' {...props}>
		{children || to}
	</a>;

export default ExternalLink;
