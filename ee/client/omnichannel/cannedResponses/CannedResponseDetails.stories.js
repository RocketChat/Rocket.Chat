import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { CannedResponseDetails } from './CannedResponseDetails';

export default {
	title: 'omnichannel/CannedResponseDetails',
	component: CannedResponseDetails,
};

const cannedResponse = {
	shortcut: 'lorem',
	text: 'Lorem ipsum dolor sit amet',
	scope: 'department',
};

export const Default = () => (
	<Box maxWidth='x300' alignSelf='center' w='full'>
		<CannedResponseDetails {...cannedResponse} />
	</Box>
);
