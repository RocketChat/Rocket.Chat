import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import { Navbar } from './Navbar';

export default {
	title: 'Components/Navbar',
	component: Box,
	decorators: [(story) => <Box display='flex'>{story()}</Box>],
} satisfies Meta<typeof Box>;

export const Default: StoryFn<typeof Box> = (_args) => <Navbar />;
