import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import IconButton from './IconButton';
import TextButton from './TextButton';

const Toolbox: FC = ({ children }) => (
	<>
		<Box display='flex' w='full' justifyContent='space-between' alignItems='center'>
			{children}
		</Box>
	</>
);

export default Object.assign(Toolbox, {
	IconButton,
	TextButton,
});
