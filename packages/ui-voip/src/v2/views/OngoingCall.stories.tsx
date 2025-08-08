import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import OngoingCall from './OngoingCall';
import MediaCallProviderMock from '../MockedMediaCallProvider';

const mockedContexts = mockAppRoot().buildStoryDecorator();

export default {
	title: 'V2/Views/OngoingCall',
	component: OngoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MediaCallProviderMock>
				<Story />
			</MediaCallProviderMock>
		),
	],
} satisfies Meta<typeof OngoingCall>;

export const OngoingCallStory: StoryFn<typeof OngoingCall> = () => {
	return <OngoingCall />;
};
