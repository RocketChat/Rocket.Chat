import { Box } from '@rocket.chat/fuselage';
import React from 'react';

function Timestamp({ ts }) {
	return (
		<Box rcx-message__time fontSize='c1' color='neutral-600' flexShrink={0} withTruncatedText>
			{ts.toDateString ? ts.toDateString() : ts}
		</Box>
	);
}

export default Timestamp;
