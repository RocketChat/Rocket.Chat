import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { IncomingCall } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Incoming_call: 'Incoming call',
		Reject: 'Reject',
		Accept: 'Accept',
	})
	.buildStoryDecorator();

export default {
	title: 'Experimental/AppActionButtons/Views/IncomingCall',
	component: IncomingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallAppActionsProvider>
				<MockedMediaCallProvider state='ringing'>
					<Story />
				</MockedMediaCallProvider>
			</MockedMediaCallAppActionsProvider>
		),
	],
} satisfies Meta<typeof IncomingCall>;

export const IncomingCallStory: StoryFn<typeof IncomingCall> = () => {
	return <IncomingCall />;
};

export const IncomingCallCallStateFilterStory: StoryFn<typeof IncomingCall> = () => {
	return (
		<MockedMediaCallAppActionsProvider
			actions={[
				{ appId: 'app-id', actionId: 'no-change-label', label: 'No filters' },
				{ appId: 'app-id', actionId: 'change-label', label: 'Filters: ringing', callStates: ['ringing'] },
				{
					appId: 'app-id',
					actionId: 'change-variant',
					label: 'Filters: calling, ongoing',
					callStates: ['calling', 'ongoing'],
				},
			]}
		>
			<IncomingCall />
		</MockedMediaCallAppActionsProvider>
	);
};
