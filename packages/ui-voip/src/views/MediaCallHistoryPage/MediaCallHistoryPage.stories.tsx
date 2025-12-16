import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MediaCallHistoryPage from './MediaCallHistoryPage';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Incoming_call: 'Incoming call',
		Reject: 'Reject',
		Accept: 'Accept',
	})
	.buildStoryDecorator();

export default {
	title: 'V2/Views/MediaCallHistoryPage',
	component: MediaCallHistoryPage,
	decorators: [mockedContexts],
} satisfies Meta<typeof MediaCallHistoryPage>;

export const MediaCallHistoryPageStory: StoryFn<typeof MediaCallHistoryPage> = () => {
	return <MediaCallHistoryPage />;
};
