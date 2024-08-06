import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import CreateCannedResponseModal from './CreateCannedResponseModal';

export default {
	title: 'Enterprise/Omnichannel/CreateCannedResponseModal',
	component: CreateCannedResponseModal,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} as ComponentMeta<typeof CreateCannedResponseModal>;

const Template: ComponentStory<typeof CreateCannedResponseModal> = (args) => <CreateCannedResponseModal {...args} />;

export const Default = Template.bind({});
