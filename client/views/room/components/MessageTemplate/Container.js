import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';

function Container({ children, ...props }) {
	return (
		<Box rcx-message__container display='flex' mi='x4' flexDirection='column' {...props}>
			<Margins block='x2'>{children}</Margins>
		</Box>
	);
}

export default Container;
