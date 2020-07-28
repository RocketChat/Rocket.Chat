import { Box } from '@rocket.chat/fuselage';
import React from 'react';

function ExternalLink({ children, to, ...props }) {
	return <Box is='a' href={to} target='_blank' rel='noopener noreferrer' {...props}>
		{children || to}
	</Box>;
}

export default ExternalLink;
