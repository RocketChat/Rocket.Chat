import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import OutgoingCall from './OutgoingCall';
import MediaCallProviderMock from '../MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Calling: 'Calling',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

export default {
	title: 'V2/Views/OutgoingCall',
	component: OutgoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MediaCallProviderMock>
				<Story />
			</MediaCallProviderMock>
		),
	],
} satisfies Meta<typeof OutgoingCall>;

export const OutgoingCallStory: StoryFn<typeof OutgoingCall> = () => {
	return <OutgoingCall />;
};
