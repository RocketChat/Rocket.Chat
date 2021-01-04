import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import DotLeader from './DotLeader';

export default {
	title: 'components/basic/DotLeader',
	component: DotLeader,
};

export const Default = () => <Box display='flex' flexDirection='row'>
	Label
	<DotLeader />
	12345
</Box>;
