import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Navbar } from './Navbar';

export default {
	title: 'Components/Navbar',
	component: Box,
	decorators: [(story) => <Box display='flex'>{story()}</Box>],
} as ComponentMeta<typeof Box>;

export const Default: ComponentStory<typeof Box> = (_args) => <Navbar />;
