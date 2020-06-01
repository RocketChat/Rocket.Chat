import React from 'react';
import { Box } from '@rocket.chat/fuselage';

export default function ExternalLink({ is = 'a', url, ...props }) {
	return <Box is={is} href={url} target='_blank' rel='noopener noreferrer' {...props}>{url}</Box>;
}
