import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import DiscussionsListItem from './DiscussionsListItem';

const mockedTranslations = [
	'en',
	'core',
	{
		__count__replies_one: '{{count}} reply',
		__count__replies_other: '{{count}} replies',
		__count__replies__date___one: '{{count}} reply, {{date}}',
		__count__replies__date___other: '{{count}} replies, {{date}}',
	},
] as const;

const baseProps = {
	_id: 'mid',
	msg: 'Discussion name',
	username: 'alice',
	ts: new Date(2024, 6, 1),
	emoji: undefined,
	formatDate: () => 'July 1st',
};

describe('DiscussionsListItem', () => {
	it('should show 0 replies when the discussion has no messages yet', () => {
		render(<DiscussionsListItem {...baseProps} dcount={undefined} dlm={undefined} />, {
			wrapper: mockAppRoot()
				.withTranslations(...mockedTranslations)
				.build(),
		});

		expect(screen.getByText('0 replies')).toBeVisible();
	});

	it('should show the reply count and the last message date', () => {
		render(<DiscussionsListItem {...baseProps} dcount={1} dlm={new Date(2024, 6, 1)} />, {
			wrapper: mockAppRoot()
				.withTranslations(...mockedTranslations)
				.build(),
		});

		expect(screen.getByText('1 reply, July 1st')).toBeVisible();
	});
});
