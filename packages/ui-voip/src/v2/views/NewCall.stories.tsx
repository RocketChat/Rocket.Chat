import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import NewCall from './NewCall';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		New_Call: 'New Call',
		Call: 'Call',
		Enter_username_or_number: 'Enter username or number',
	})
	.buildStoryDecorator();

export default {
	title: 'V2/Views/NewCall',
	component: NewCall,
	decorators: [mockedContexts, (Story) => <Story />],
} satisfies Meta<typeof NewCall>;

export const NewCallStory: StoryFn<typeof NewCall> = () => {
	return <NewCall />;
};
