import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import OutgoingCall from './OutgoingCall';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferred_call__from__to: '{{from}} transferred call to',
		Transferring_call: 'Transferring call',
		meteor_status_connecting: 'Connecting...',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

const meta = {
	component: OutgoingCall,
	decorators: [
		mockedContexts,
		(Story, options) => (
			<MockedMediaCallProvider transferredBy='Joy' connectionState={options.args.connecting ? 'CONNECTING' : 'CONNECTED'}>
				<Story />
			</MockedMediaCallProvider>
		),
	],
	args: { connecting: false },
} satisfies Meta<{ connecting: boolean }>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OutgoingCallTransferStory: Story = {};

export const OutgoingCallTransferConnectingStory: Story = {
	args: { connecting: true },
};
