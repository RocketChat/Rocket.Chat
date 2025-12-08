import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import IncomingCall from './IncomingCall';
import { MockedMediaCallProvider } from '../../context';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Incoming_call: 'Incoming call',
		Reject: 'Reject',
		Accept: 'Accept',
	})
	.buildStoryDecorator();

export default {
	title: 'V2/Views/IncomingCall',
	component: IncomingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof IncomingCall>;

export const IncomingCallStory: StoryFn<typeof IncomingCall> = () => {
	return <IncomingCall />;
};
