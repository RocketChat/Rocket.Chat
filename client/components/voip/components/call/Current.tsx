import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import CallControls from './CallControls';

// import { useTranslation } from '../../../../contexts/TranslationContext';

const Current: FC<{ room: any }> = ({ room }) => {
	// const t = useTranslation();
	console.log('fuck ts');
	return (
		<Box textAlign='center'>
			<CallControls room={room}></CallControls>
		</Box>
	);
};

export default Current;
