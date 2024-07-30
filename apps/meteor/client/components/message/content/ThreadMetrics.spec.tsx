import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';

import { createFakeUser } from '../../../../tests/mocks/data';
// import ThreadMetrics from './ThreadMetrics';
import ThreadMetricsFollow from './ThreadMetricsFollow';
import ThreadMetricsParticipants from './ThreadMetricsParticipants';

describe('ThreadMetrics', () => {
	describe('ThreadMetricsFollow', () => {
		it('should render unfollowed', (done) => {
			render(<ThreadMetricsFollow unread={true} mention={false} all={false} mid='mid' rid='rid' following={false} />, {
				wrapper: mockAppRoot()
					.withEndpoint('POST', '/v1/chat.followMessage', ({ mid }) => {
						expect(mid).toBe('mid');
						done();
						return null;
					})
					.build(),
			});
			const followButton = screen.getByTitle('Not_following');
			expect(followButton).toBeVisible();
			userEvent.click(followButton);
		});
		it('should render followed', (done) => {
			render(<ThreadMetricsFollow unread={true} mention={false} all={false} mid='mid' rid='rid' following={false} />, {
				wrapper: mockAppRoot()
					.withEndpoint('POST', '/v1/chat.unfollowMessage', ({ mid }) => {
						expect(mid).toBe('mid');
						done();
						return null;
					})
					.build(),
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
					.withEndpoint('GET', '/v1/users.info', ({ userId }) => ({ user: createFakeUser({ _id: userId, username: userId }) as any }))
					.withTranslations('en', 'core', {
						follower_one: 'follower',
						follower_other: 'followers',
					})
					.build(),
			});
			expect(await screen.findByTitle('follower')).toBeVisible();
			expect(await screen.findByTitle('user1')).toBeVisible();
		});
		it('should render 2 avatars', async () => {
			render(<ThreadMetricsParticipants participants={['user1', 'user2']} />, {
				wrapper: mockAppRoot()
					.withEndpoint('GET', '/v1/users.info', ({ userId }) => ({ user: createFakeUser({ _id: userId, username: userId }) as any }))
					.withTranslations('en', 'core', {
						follower_one: 'follower',
						follower_other: 'followers',
					})
					.build(),
			});
			expect(await screen.findByTitle('followers')).toBeVisible();
			expect(await screen.findByTitle('user1')).toBeVisible();
			expect(await screen.findByTitle('user2')).toBeVisible();
		});
		it('should render 2 avatars and "+1" text', async () => {
			render(<ThreadMetricsParticipants participants={['user1', 'user2', 'user3']} />, {
				wrapper: mockAppRoot()
					.withEndpoint('GET', '/v1/users.info', ({ userId }) => ({ user: createFakeUser({ _id: userId, username: userId }) as any }))
					.withTranslations('en', 'core', {
						follower_one: 'follower',
						follower_other: 'followers',
					})
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
					.withEndpoint('GET', '/v1/users.info', ({ userId }) => ({ user: createFakeUser({ _id: userId, username: userId }) as any }))
					.withTranslations('en', 'core', {
						follower_one: 'follower',
						follower_other: 'followers',
					})
					.build(),
			});
			expect(await screen.findByTitle('followers')).toBeVisible();
			expect(await screen.findByTitle('user1')).toBeVisible();
			expect(await screen.findByTitle('user2')).toBeVisible();
			expect(await screen.findByText('+5')).toBeVisible();
		});
	});
});
