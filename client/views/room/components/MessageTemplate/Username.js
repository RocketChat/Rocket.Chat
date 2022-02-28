import { Box } from '@rocket.chat/fuselage';
import React from 'react';

function Username(props) {
	return <Box rcx-message__username color='neutral-800' fontSize='x14' fontWeight='600' flexShrink={1} withTruncatedText {...props} />;
}

export default Username;
