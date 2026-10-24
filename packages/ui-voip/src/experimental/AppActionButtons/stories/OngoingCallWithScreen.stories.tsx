import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import OngoingCall from '../../../views/MediaCallWidget/OngoingCallWithScreen';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot().buildStoryDecorator();

export default {
	title: 'Experimental/AppActionButtons/Views/OngoingCallWithScreen',
	component: OngoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallAppActionsProvider>
				<MockedMediaCallProvider state='ongoing'>
					<Story />
				</MockedMediaCallProvider>
			</MockedMediaCallAppActionsProvider>
		),
	],
} satisfies Meta<typeof OngoingCall>;

export const OngoingCallWithScreenStory: StoryFn<typeof OngoingCall> = () => {
	return <OngoingCall />;
};
