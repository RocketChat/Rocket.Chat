import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { DotLeader } from './DotLeader';

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
