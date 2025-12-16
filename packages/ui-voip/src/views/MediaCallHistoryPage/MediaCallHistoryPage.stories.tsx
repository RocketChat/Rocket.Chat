import type { CallHistoryItemState } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useSort } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';

import MediaCallHistoryPage from './MediaCallHistoryPage';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Voice: 'Voice',
		Ended: 'Ended',
		Not_answered: 'Not answered',
		Failed: 'Failed',
		Transferred: 'Transferred',
		Contact: 'Contact',
		Type: 'Type',
		Status: 'Status',
		Time_slash_Date: 'Time / Date',
	})
	.withDefaultLanguage('pt-BR')
	.buildStoryDecorator();

export default {
	title: 'V2/Views/MediaCallHistoryPage',
	component: MediaCallHistoryPage,
	decorators: [mockedContexts],
} satisfies Meta<typeof MediaCallHistoryPage>;

const getStatus = (index: number) => {
	if (index % 4 === 0) {
		return 'ended';
	}
	if (index % 4 === 1) {
		return 'not-answered';
	}
	if (index % 4 === 2) {
		return 'failed';
	}
	return 'transferred';
};

const getDate = (index: number) => {
	const date = new Date();
	if (index % 5 === 0) {
		return new Date(date.setSeconds(date.getSeconds() - 10));
	}
	if (index % 5 === 1) {
		return new Date(date.setDate(date.getDate() - 1));
	}
	if (index % 5 === 2) {
		return new Date(date.setMinutes(date.getMinutes() - 1));
	}
	if (index % 5 === 3) {
		return new Date(date.setHours(date.getHours() - 1));
	}

	return new Date(date.setMonth(date.getMonth() - 2));
};

const results = Array.from({ length: 100 }).map(
	(_, index): { contact: string; type: 'outbound' | 'inbound'; status: CallHistoryItemState; duration: number; timestamp: string } => ({
		contact: `User ${index}`,
		type: index % 2 ? 'outbound' : 'inbound',
		status: getStatus(index),
		duration: index % 2 ? 120 : 0,
		timestamp: getDate(index).toISOString(),
	}),
);

export const MediaCallHistoryPageStory: StoryFn<typeof MediaCallHistoryPage> = () => {
	const sort = useSort<'contact' | 'type' | 'status' | 'timestamp'>('contact');
	return <MediaCallHistoryPage sort={sort} data={results} />;
};
