import React from 'react';
import { Box } from '@rocket.chat/fuselage';

// import { useTranslation } from '../../../../../contexts/TranslationContext';

export const StarredMessagesList = ({ messages }) => {
	const content = messages.map(({ msg }, idx) => <Box key={idx}>{msg}</Box>);

	return	<Box fontScale='p2'>
		{content}
	</Box>;
};
