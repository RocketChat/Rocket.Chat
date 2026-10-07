import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { IncomingCall } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

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
	title: 'Experimental/AppActionButtons/Views/IncomingCallTransfer',
	component: IncomingCall,
	decorators: [
		mockedContexts,
		(Story, options) => {
			return (
				<MockedMediaCallAppActionsProvider>
					<MockedMediaCallProvider
						state='ringing'
						transferredBy='Jason'
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

export const IncomingCallTransferStory: StoryFn<typeof meta> = () => {
	return <IncomingCall />;
};
