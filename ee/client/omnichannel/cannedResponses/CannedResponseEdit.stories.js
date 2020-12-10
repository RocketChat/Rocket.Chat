import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import CannedResponseEdit from './CannedResponseEdit';

export default {
	title: 'omnichannel/CannedResponseEdit',
	component: CannedResponseEdit,
};

const cannedResponse = {
	shortcut: 'lorem',
	text: 'Lorem ipsum dolor sit amet',
};

export const Default = () => <Box maxWidth='x300' alignSelf='center' w='full'>
	<CannedResponseEdit {...cannedResponse}/>
</Box>;
