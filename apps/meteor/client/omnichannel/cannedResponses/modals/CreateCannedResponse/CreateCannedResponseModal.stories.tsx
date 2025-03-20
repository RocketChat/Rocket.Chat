import type { Meta, StoryFn } from '@storybook/react';

import CreateCannedResponseModal from './CreateCannedResponseModal';

export default {
	title: 'Enterprise/Omnichannel/CreateCannedResponseModal',
	component: CreateCannedResponseModal,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} satisfies Meta<typeof CreateCannedResponseModal>;

const Template: StoryFn<typeof CreateCannedResponseModal> = (args) => <CreateCannedResponseModal {...args} />;

export const Default = Template.bind({});
