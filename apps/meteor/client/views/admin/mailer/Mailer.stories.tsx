import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Mailer } from './Mailer';

export default {
	title: 'Admin/Mailer/Mailer',
	component: Mailer,
	parameters: {
		layout: 'fullscreen',
	},
} as ComponentMeta<typeof Mailer>;

export const Default: ComponentStory<typeof Mailer> = (args) => <Mailer {...args} />;
Default.storyName = 'Mailer';
