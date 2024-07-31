import { mockAppRoot, MockedRouterContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { type WrapperComponent } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';

import { createFakeUser } from '../../../../tests/mocks/data';
import ThreadMetrics from './ThreadMetrics';
import ThreadMetricsFollow from './ThreadMetricsFollow';
import ThreadMetricsParticipants from './ThreadMetricsParticipants';

const usersInfoMock = ({ userId }: { userId: string }) => ({ user: createFakeUser({ _id: userId, username: userId }) as any });
const toggleFollowMock =
	(done: jest.DoneCallback | (() => undefined)) =>
	({ mid }: { mid: string }) => {
		expect(mid).toBe('mid');
		done();
		return null;
	};

global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

const mockRoot = () => {
	const AppRoot = mockAppRoot();
	const buildWithRouter = (navigate: (args: any[]) => void): WrapperComponent<{ children: ReactNode }> => {
		const Wrapper = AppRoot.build();
		return function Mock({ children }) {
			return (
				<Wrapper>
					<MockedRouterContext router={{ navigate, getRouteName: () => 'thread' }}>{children}</MockedRouterContext>
				</Wrapper>
			);
		};
	};

	return Object.assign(AppRoot, { buildWithRouter });
};

const mockedTranslations = [
	'en',
	'core',
	{
		follower_one: 'follower',
		follower_other: 'followers',
		__count__replies__date__: '{{count}} replies {{date}}',
		__count__replies: '{{count}} replies',
	},
] as const;

let inlineSize = 400;
jest.mock('@rocket.chat/fuselage-hooks', () => {
	const originalModule = jest.requireActual('@rocket.chat/fuselage-hooks');
	return {
		...originalModule,
		useResizeObserver: () => ({ ref: () => undefined, borderBoxSize: { inlineSize } }),
	};
});

describe('Thread Metrics', () => {
	describe('Main component', () => {
		it('should render large followed with 3 parcipants and unread', async () => {
			const navigateSpy = jest.fn();
			const navigateCallback = (route: any) => {
				navigateSpy(route.name, route.params.rid, route.params.tab, route.params.context);
			};

			render(
				<ThreadMetrics
					lm={new Date(2024, 6, 1, 0, 0, 0)}
					counter={5}
					participants={['user1', 'user2', 'user3']}
					unread={true}
					mention={false}
					all={false}
					mid='mid'
					rid='rid'
					following={true}
				/>,
				{
					wrapper: mockRoot()
						.withEndpoint(
							'POST',
							'/v1/chat.followMessage',
							toggleFollowMock(() => undefined),
						)
						.withEndpoint(
							'POST',
							'/v1/chat.unfollowMessage',
							toggleFollowMock(() => undefined),
						)
						.withEndpoint('GET', '/v1/users.info', usersInfoMock)
						.withUserPreference('clockMode', 1)
						.withSetting('Message_TimeFormat', 'LT')
						.withTranslations(...mockedTranslations)
						.buildWithRouter(navigateCallback),
				},
			);

			const followButton = screen.getByTitle('Following');
			expect(followButton).toBeVisible();
			// userEvent.click(followButton);

			const badge = screen.getByRole('status');
			expect(badge).toBeVisible();

			expect(await screen.findByTitle('followers')).toBeVisible();
			expect(await screen.findByTitle('user1')).toBeVisible();
			expect(await screen.findByTitle('user2')).toBeVisible();
			expect(await screen.findByText('+1')).toBeVisible();

			const replyButton = screen.getByText('View_thread');
			expect(replyButton).toBeVisible();
			userEvent.click(replyButton);

			expect(navigateSpy).toHaveBeenCalledWith('thread', 'rid', 'thread', 'mid');

			const threadCount = screen.getByTitle('Last_message__date__');
			expect(threadCount).toHaveTextContent('5 replies July 1, 2024');
		});

		it('should render small unfollowed with 3 parcipants and unread', async () => {
			const navigateSpy = jest.fn();
			const navigateCallback = (route: any) => {
				navigateSpy(route.name, route.params.rid, route.params.tab, route.params.context);
			};
			inlineSize = 200;

			render(
				<ThreadMetrics
					lm={new Date(2024, 6, 1, 0, 0, 0)}
					counter={5}
					participants={['user1', 'user2', 'user3']}
					unread={true}
					mention={false}
					all={false}
					mid='mid'
					rid='rid'
					following={false}
				/>,
				{
					wrapper: mockRoot()
						.withEndpoint(
							'POST',
							'/v1/chat.followMessage',
							toggleFollowMock(() => undefined),
						)
						.withEndpoint(
							'POST',
							'/v1/chat.unfollowMessage',
							toggleFollowMock(() => undefined),
						)
						.withEndpoint('GET', '/v1/users.info', usersInfoMock)
						.withUserPreference('clockMode', 1)
						.withSetting('Message_TimeFormat', 'LT')
						.withTranslations(...mockedTranslations)
						.buildWithRouter(navigateCallback),
				},
			);
			const followButton = screen.getByTitle('Not_following');
			expect(followButton).toBeVisible();

			const badge = screen.getByRole('status');
			expect(badge).toBeVisible();

			expect(await screen.findByTitle('followers')).toBeVisible();
			expect(await screen.findByTitle('user1')).toBeVisible();
			expect(await screen.findByTitle('user2')).toBeVisible();
			expect(await screen.findByText('+1')).toBeVisible();

			const replyButton = screen.getByText('View_thread');
			expect(replyButton).toBeVisible();
			userEvent.click(replyButton);

			expect(navigateSpy).toHaveBeenCalledWith('thread', 'rid', 'thread', 'mid');

			const threadCount = screen.getByTitle('Last_message__date__');
			expect(threadCount).toHaveTextContent('5 replies');
		});
	});

	describe('ThreadMetricsFollow', () => {
		it('should render unfollowed', (done) => {
			render(<ThreadMetricsFollow unread={true} mention={false} all={false} mid='mid' rid='rid' following={false} />, {
				wrapper: mockAppRoot().withEndpoint('POST', '/v1/chat.followMessage', toggleFollowMock(done)).build(),
			});
			const followButton = screen.getByTitle('Not_following');
			expect(followButton).toBeVisible();
			userEvent.click(followButton);
		});
		it('should render followed', (done) => {
			render(<ThreadMetricsFollow unread={true} mention={false} all={false} mid='mid' rid='rid' following={true} />, {
				wrapper: mockAppRoot().withEndpoint('POST', '/v1/chat.unfollowMessage', toggleFollowMock(done)).build(),
			});
			const followButton = screen.getByTitle('Following');
			expect(followButton).toBeVisible();
			userEvent.click(followButton);
		});
		it('should render badge', () => {
			render(<ThreadMetricsFollow unread={true} mention={false} all={false} mid='mid' rid='rid' following={false} />, {
				wrapper: mockAppRoot().build(),
			});
			const badge = screen.getByRole('status');
			expect(badge).toBeVisible();
		});
	});
	describe('ThreadMetricsParticipants', () => {
		it('should render 1 avatars', async () => {
			render(<ThreadMetricsParticipants participants={['user1']} />, {
				wrapper: mockAppRoot()
					.withEndpoint('GET', '/v1/users.info', usersInfoMock)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			expect(await screen.findByTitle('follower')).toBeVisible();
			expect(await screen.findByTitle('user1')).toBeVisible();
		});
		it('should render 2 avatars', async () => {
			render(<ThreadMetricsParticipants participants={['user1', 'user2']} />, {
				wrapper: mockAppRoot()
					.withEndpoint('GET', '/v1/users.info', usersInfoMock)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			expect(await screen.findByTitle('followers')).toBeVisible();
			expect(await screen.findByTitle('user1')).toBeVisible();
			expect(await screen.findByTitle('user2')).toBeVisible();
		});
		it('should render 2 avatars and "+1" text', async () => {
			render(<ThreadMetricsParticipants participants={['user1', 'user2', 'user3']} />, {
				wrapper: mockAppRoot()
					.withEndpoint('GET', '/v1/users.info', usersInfoMock)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			expect(await screen.findByTitle('followers')).toBeVisible();
			expect(await screen.findByTitle('user1')).toBeVisible();
			expect(await screen.findByTitle('user2')).toBeVisible();
			expect(await screen.findByText('+1')).toBeVisible();
		});
		it('should render 2 avatars and "+5" text', async () => {
			render(<ThreadMetricsParticipants participants={['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7']} />, {
				wrapper: mockAppRoot()
					.withEndpoint('GET', '/v1/users.info', usersInfoMock)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			expect(await screen.findByTitle('followers')).toBeVisible();
			expect(await screen.findByTitle('user1')).toBeVisible();
			expect(await screen.findByTitle('user2')).toBeVisible();
			expect(await screen.findByText('+5')).toBeVisible();
		});
	});
});
