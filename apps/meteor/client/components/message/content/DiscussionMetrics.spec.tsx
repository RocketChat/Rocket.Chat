import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DiscussionMetrics from './DiscussionMetrics';
import { createFakeSubscription } from '../../../../tests/mocks/data';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

jest.mock('@rocket.chat/fuselage-hooks', () => {
	const originalModule = jest.requireActual('@rocket.chat/fuselage-hooks');
	return {
		...originalModule,
		useResizeObserver: () => ({ ref: () => undefined, borderBoxSize: { inlineSize: 400 } }),
	};
});

const mockedTranslations = [
	'en',
	'core',
	{
		__count__members_one: '{{count}} member',
		__count__members_other: '{{count}} members',
		__count__replies_one: '{{count}} reply',
		__count__replies_other: '{{count}} replies',
		__count__replies__date___one: '{{count}} reply, {{date}}',
		__count__replies__date___other: '{{count}} replies, {{date}}',
	},
] as const;

const members = {
	members: [{ _id: 'user1' }, { _id: 'user2' }],
	count: 2,
	offset: 0,
	total: 5,
} as any;

describe('DiscussionMetrics', () => {
	it('should render a secondary button and a join action when the user is not a member', async () => {
		const joinSpy = jest.fn();

		render(<DiscussionMetrics rid='rid' drid='drid' count={0} />, {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/rooms.membersOrderedByRole', () => members)
				.withEndpoint('POST', '/v1/rooms.join', (params) => {
					joinSpy(params);
					return { room: {} as any };
				})
				.withUserPreference('displayAvatars', true)
				.withTranslations(...mockedTranslations)
				.build(),
		});

		const button = screen.getByRole('button', { name: 'Discussion' });
		expect(button).toBeVisible();
		expect(button).not.toHaveClass('rcx-button--primary');

		expect(screen.getByText('No_replies')).toBeVisible();
		expect(await screen.findByTitle('5 members')).toBeVisible();
		expect(screen.getByText('+3')).toBeVisible();

		await userEvent.click(screen.getByRole('button', { name: 'Join' }));
		expect(joinSpy).toHaveBeenCalledWith({ roomId: 'drid' });
	});

	it('should render a primary button and a leave action when the user is a member with unread messages', async () => {
		render(<DiscussionMetrics rid='rid' drid='drid' count={2} lm={new Date(2024, 6, 1, 0, 0, 0)} />, {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/rooms.membersOrderedByRole', () => members)
				.withSubscription(createFakeSubscription({ rid: 'drid', unread: 2 }))
				.withUserPreference('clockMode', 1)
				.withSetting('Message_TimeFormat', 'LT')
				.withTranslations(...mockedTranslations)
				.build(),
		});

		expect(screen.getByRole('button', { name: 'Discussion' })).toHaveClass('rcx-button--primary');
		expect(screen.getByRole('button', { name: 'Leave' })).toBeVisible();
		expect(screen.getByTitle('Last_message__date__')).toHaveTextContent('2 replies, July 1st, 2024');
	});
});
