import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Col: FC<{ span?: number }> = ({ children, span = 1 }) => {
	const w = span * 228 + (span - 1) * 2 * 24;

	return (
		<Box
			rcx-card-col
			display='flex'
			alignSelf='stretch'
			w={`x${w}`}
			flexDirection='column'
			fontScale='c1'
		>
			{children}
		</Box>
	);
};

export default Col;
