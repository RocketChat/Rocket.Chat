import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import { DotLeader } from './DotLeader';

export default {
	title: 'Components/DotLeader',
	component: DotLeader,
} satisfies Meta<typeof DotLeader>;

export const Default: StoryFn<typeof DotLeader> = (args) => (
	<Box display='flex' flexDirection='row'>
		Label
		<DotLeader {...args} />
		12345
	</Box>
);
Default.storyName = 'DotLeader';
