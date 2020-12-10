import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import CannedResponsesList from './CannedResponsesList';

export default {
	title: 'omnichannel/CannedResponsesList',
	component: CannedResponsesList,
};

const cannedResponses = [{
	shortcut: 'lorem',
	text: 'Lorem ipsum dolor sit amet',
	scope: 'department',
}, {
	shortcut: 'lorem',
	text: 'Lorem ipsum dolor sit amet',
	scope: 'department',
}, {
	shortcut: 'lorem',
	text: 'Lorem ipsum dolor sit amet',
	scope: 'department',
}];

export const Default = () => <Box maxWidth='x300' alignSelf='center' w='full'>
	<CannedResponsesList responses={cannedResponses}/>
</Box>;
