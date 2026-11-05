import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { OutgoingCall } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferred_call__from__to: '{{from}} transferred call to',
		Transferring_call: 'Transferring call',
		meteor_status_connecting: 'Connecting...',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

const meta = {
	title: 'Experimental/AppActionButtons/Views/OutgoingCallTransfer',
	component: OutgoingCall,
	decorators: [
		mockedContexts,
		(Story, options) => {
			return (
				<MockedMediaCallAppActionsProvider>
					<MockedMediaCallProvider
						state='calling'
						transferredBy='Joy'
						connectionState={options.args.connecting ? 'CONNECTING' : 'CONNECTED'}
					>
						<Story />
					</MockedMediaCallProvider>
				</MockedMediaCallAppActionsProvider>
			);
		},
	],
	args: { connecting: false },
} satisfies Meta<{ connecting: boolean }>;

export default meta;

export const OutgoingCallTransferStory: StoryFn<typeof meta> = () => {
	return <OutgoingCall />;
};
