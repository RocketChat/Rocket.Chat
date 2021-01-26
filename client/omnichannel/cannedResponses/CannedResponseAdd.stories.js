import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import CannedResponseAdd from './CannedResponseAdd';

export default {
	title: 'omnichannel/CannedResponseAdd',
	component: CannedResponseAdd,
};

export const Default = () => <Box maxWidth='x300' alignSelf='center' w='full'>
	<CannedResponseAdd />
</Box>;
