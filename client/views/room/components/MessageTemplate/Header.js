import { Box, Margins } from '@rocket.chat/fuselage';
import React from 'react';

function Header({ children }) {
	return (
		<Box rcx-message__header display='flex' flexGrow={0} flexShrink={1} withTruncatedText>
			<Box mi='neg-x2' display='flex' flexDirection='row' alignItems='baseline' withTruncatedText flexGrow={1} flexShrink={1}>
				<Margins inline='x2'> {children} </Margins>
			</Box>
		</Box>
	);
}

export default Header;
