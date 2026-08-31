import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import DotLeader from './DotLeader';

export default {
	component: DotLeader,
} satisfies Meta<typeof DotLeader>;

export const Default: StoryObj<typeof DotLeader> = {
	name: 'DotLeader',
	render: (args) => (
		<Box display='flex' flexDirection='row'>
			Label
			<DotLeader {...args} />
			12345
		</Box>
	),
};
