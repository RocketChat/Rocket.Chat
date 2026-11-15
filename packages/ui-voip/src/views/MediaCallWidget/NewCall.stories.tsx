import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import NewCall from './NewCall';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		New_Call: 'New Call',
		Call: 'Call',
		Enter_username_or_number: 'Enter username or number',
	})
	.buildStoryDecorator();

export default {
	component: NewCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof NewCall>;

export const NewCallStory: StoryObj<typeof NewCall> = {};
