import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import IncomingCall from './IncomingCall';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferring_call_incoming: 'Incoming call transfer',
		Transferring_call_incoming__from_: 'From {{from}}',
		meteor_status_connecting: 'Connecting...',
		Reject: 'Reject',
		Accept: 'Accept',
	})
	.buildStoryDecorator();

const meta = {
	component: IncomingCall,
	decorators: [
		mockedContexts,
		(Story, options) => {
			return (
				<MockedMediaCallProvider transferredBy='Jason' connectionState={options.args.connecting ? 'CONNECTING' : 'CONNECTED'}>
					<Story />
				</MockedMediaCallProvider>
			);
		},
	],
	args: { connecting: false },
} satisfies Meta<{ connecting: boolean }>;

export default meta;

export const IncomingCallTransferStory: StoryObj<typeof meta> = {};

export const IncomingCallTransferConnectingStory: StoryObj<typeof meta> = {
	args: { connecting: true },
};
