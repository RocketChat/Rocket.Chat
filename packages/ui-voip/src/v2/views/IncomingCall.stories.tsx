import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import IncomingCall from './IncomingCall';
import MediaCallProviderMock from '../MockedMediaCallProvider';

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
			<MediaCallProviderMock>
				<Story />
			</MediaCallProviderMock>
		),
	],
} satisfies Meta<typeof IncomingCall>;

export const IncomingCallStory: StoryFn<typeof IncomingCall> = () => {
	return <IncomingCall />;
};
