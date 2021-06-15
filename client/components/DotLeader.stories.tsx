import { Box } from '@rocket.chat/fuselage';
import { Story } from '@storybook/react';
import React from 'react';

import DotLeader from './DotLeader';

export default {
	title: 'components/DotLeader',
	component: DotLeader,
};

export const Default: Story = () => (
	<Box display='flex' flexDirection='row'>
		Label
		<DotLeader />
		12345
	</Box>
);
