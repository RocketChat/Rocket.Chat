import { Box } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import DotLeader from './DotLeader';

export default {
	title: 'Components/DotLeader',
	component: DotLeader,
} as ComponentMeta<typeof DotLeader>;

export const Default: ComponentStory<typeof DotLeader> = (args) => (
	<Box display='flex' flexDirection='row'>
		Label
		<DotLeader {...args} />
		12345
	</Box>
);
Default.storyName = 'DotLeader';
