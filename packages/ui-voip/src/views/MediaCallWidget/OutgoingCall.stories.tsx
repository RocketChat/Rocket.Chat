import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import OutgoingCall from './OutgoingCall';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Calling: 'Calling',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

export default {
	component: OutgoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof OutgoingCall>;

export const OutgoingCallStory: StoryObj<typeof OutgoingCall> = {};
