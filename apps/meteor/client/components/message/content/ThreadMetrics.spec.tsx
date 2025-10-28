import { mockAppRoot, MockedRouterContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import ThreadMetrics from './ThreadMetrics';
import ThreadMetricsFollow from './ThreadMetricsFollow';
import ThreadMetricsParticipants from './ThreadMetricsParticipants';

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
	const buildWithRouter = (navigate: (...args: any[]) => void) => {
		const Wrapper = AppRoot.build();
		return function Mock({ children }: { children: ReactNode }) {
			return (
				<Wrapper>
					<MockedRouterContext router={{ navigate, getRouteName: () => 'thread' as any }}>{children}</MockedRouterContext>
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
		Follower_one: 'follower',
		Follower_other: 'followers',
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
		it('should render large followed with 3 participants and unread', async () => {
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
						.withUserPreference('clockMode', 1)
						.withSetting('Message_TimeFormat', 'LT')
						.withTranslations(...mockedTranslations)
						.buildWithRouter(navigateCallback),
				},
			);

			const followButton = screen.getByTitle('Following');
			expect(followButton).toBeVisible();

			const badge = screen.getByTitle('Unread');
			expect(badge).toBeVisible();

			expect(screen.getByTitle('followers')).toBeVisible();
			expect(screen.getByText('3')).toBeVisible();

			const replyButton = screen.getByText('View_thread');
			expect(replyButton).toBeVisible();
			await userEvent.click(replyButton);

			expect(navigateSpy).toHaveBeenCalledWith('thread', 'rid', 'thread', 'mid');

			const threadCount = screen.getByTitle('Last_message__date__');
			expect(threadCount).toHaveTextContent('5 replies July 1, 2024');
		});

		it('should render small not followed with 3 participants and unread', async () => {
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
						.withUserPreference('clockMode', 1)
						.withSetting('Message_TimeFormat', 'LT')
						.withTranslations(...mockedTranslations)
						.buildWithRouter(navigateCallback),
				},
			);
			const followButton = screen.getByTitle('Not_following');
			expect(followButton).toBeVisible();

			const badge = screen.getByTitle('Unread');
			expect(badge).toBeVisible();

			expect(screen.getByTitle('followers')).toBeVisible();
			expect(screen.getByText('3')).toBeVisible();

			const replyButton = screen.getByText('View_thread');
			expect(replyButton).toBeVisible();
			await userEvent.click(replyButton);

			expect(navigateSpy).toHaveBeenCalledWith('thread', 'rid', 'thread', 'mid');

			const threadCount = screen.getByTitle('Last_message__date__');
			expect(threadCount).toHaveTextContent('5 replies');
		});
	});

	describe('ThreadMetricsFollow', () => {
		it('should render not followed', async () => {
			render(<ThreadMetricsFollow unread={true} mention={false} all={false} mid='mid' rid='rid' following={false} />, {
				wrapper: mockAppRoot()
					.withEndpoint(
						'POST',
						'/v1/chat.followMessage',
						toggleFollowMock(() => undefined),
					)
					.build(),
			});
			const followButton = screen.getByTitle('Not_following');
			expect(followButton).toBeVisible();
			await userEvent.click(followButton);
		});
		it('should render followed', async () => {
			render(<ThreadMetricsFollow unread={true} mention={false} all={false} mid='mid' rid='rid' following={true} />, {
				wrapper: mockAppRoot()
					.withEndpoint(
						'POST',
						'/v1/chat.unfollowMessage',
						toggleFollowMock(() => undefined),
					)
					.build(),
			});
			const followButton = screen.getByTitle('Following');
			expect(followButton).toBeVisible();
			await userEvent.click(followButton);
		});
		it('should render unread badge', () => {
			render(<ThreadMetricsFollow unread={true} mention={false} all={false} mid='mid' rid='rid' following={false} />, {
				wrapper: mockAppRoot().build(),
			});
			const badge = screen.getByTitle('Unread');
			expect(badge).toBeVisible();
		});
		it('should render mention-all badge', () => {
			render(<ThreadMetricsFollow unread={true} mention={false} all={true} mid='mid' rid='rid' following={false} />, {
				wrapper: mockAppRoot().build(),
			});
			const badge = screen.getByTitle('mention-all');
			expect(badge).toBeVisible();
		});
		it('should render Mentions_you badge', () => {
			render(<ThreadMetricsFollow unread={true} mention={true} all={false} mid='mid' rid='rid' following={false} />, {
				wrapper: mockAppRoot().build(),
			});
			const badge = screen.getByTitle('Mentions_you');
			expect(badge).toBeVisible();
		});
	});
	describe('ThreadMetricsParticipants', () => {
		it('should render 1 avatars', () => {
			render(<ThreadMetricsParticipants participants={['user1']} />, {
				wrapper: mockAppRoot()
					.withUserPreference('displayAvatars', true)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			expect(screen.getByTitle('follower')).toBeVisible();
			const avatars = screen.getAllByRole('figure');
			expect(avatars.length).toBe(1);
			expect(avatars.pop()).toBeVisible();
		});
		it('should render 2 avatars', () => {
			render(<ThreadMetricsParticipants participants={['user1', 'user2']} />, {
				wrapper: mockAppRoot()
					.withUserPreference('displayAvatars', true)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			expect(screen.getByTitle('followers')).toBeVisible();
			const avatars = screen.getAllByRole('figure');
			expect(avatars.length).toBe(2);
			avatars.forEach((avatar) => expect(avatar).toBeVisible());
		});
		it('should render 2 avatars and "+1" text', () => {
			render(<ThreadMetricsParticipants participants={['user1', 'user2', 'user3']} />, {
				wrapper: mockAppRoot()
					.withUserPreference('displayAvatars', true)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			expect(screen.getByTitle('followers')).toBeVisible();
			const avatars = screen.getAllByRole('figure');
			expect(avatars.length).toBe(2);
			avatars.forEach((avatar) => expect(avatar).toBeVisible());
			expect(screen.getByText('+1')).toBeVisible();
		});
		it('should render 2 avatars and "+5" text', () => {
			render(<ThreadMetricsParticipants participants={['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7']} />, {
				wrapper: mockAppRoot()
					.withUserPreference('displayAvatars', true)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			expect(screen.getByTitle('followers')).toBeVisible();

			const avatars = screen.getAllByRole('figure');
			expect(avatars.length).toBe(2);
			avatars.forEach((avatar) => expect(avatar).toBeVisible());

			expect(screen.getByText('+5')).toBeVisible();
		});

		it('should render user icon and 1 follower', () => {
			render(<ThreadMetricsParticipants participants={['user1']} />, {
				wrapper: mockAppRoot()
					.withUserPreference('displayAvatars', false)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			const follower = screen.getByTitle('follower');
			expect(follower).toBeVisible();

			// eslint-disable-next-line testing-library/no-node-access
			expect(follower.querySelector('.rcx-icon--name-user')).toBeVisible();

			expect(screen.getByText('1')).toBeVisible();
		});

		it('should render user icon and 5 followers', () => {
			render(<ThreadMetricsParticipants participants={['user1', 'user2', 'user3', 'user4', 'user5']} />, {
				wrapper: mockAppRoot()
					.withUserPreference('displayAvatars', false)
					.withTranslations(...mockedTranslations)
					.build(),
			});
			const follower = screen.getByTitle('followers');
			expect(follower).toBeVisible();

			// eslint-disable-next-line testing-library/no-node-access
			expect(follower.querySelector('.rcx-icon--name-user')).toBeVisible();

			expect(screen.getByText('5')).toBeVisible();
		});
	});
});
