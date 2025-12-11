import { UserStatus, type IUserSession } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.describe('Should remove stale sessions', () => {
	test('user1 sees user2 offline after inactivity', async ({ browser, db }) => {
		test.slow();

		const [user1Context, user2Context] = await Promise.all([
			browser.newContext({ storageState: Users.user1.state }),
			browser.newContext({ storageState: Users.user2.state }),
		]);

		const [user1Page, user2Page] = await Promise.all([user1Context.newPage(), user2Context.newPage()]);

		await Promise.all([user1Page.goto('/home'), user2Page.goto('/home')]);

		const user1Home = new HomeChannel(user1Page);

		await user1Home.sidenav.openChat('user2');

		await Promise.all([
			expect(user1Home.content.channelHeader).toContainText('user2'),
			expect(user1Home.content.channelHeader.locator('.rcx-status-bullet--online')).toBeVisible(),
		]);

		await test.step('Simulate inactivity by updating user2 session and status', async () => {
			await test.step('Close user2 page to simulate disconnection', async () => {
				await user2Context.setOffline(true);
			});
			await db.users.updateStatusById(Users.user2.data._id, {
				status: UserStatus.ONLINE,
				statusConnection: UserStatus.ONLINE,
			});

			const user2Session: IUserSession = (await db.usersSessions.findOneById(Users.user2.data._id)) ?? {
				_id: Users.user2.data._id,
				connections: [],
			};

			expect(user2Session.connections.length).toBeGreaterThan(0);

			await db.usersSessions.col.updateOne(
				{ _id: Users.user2.data._id },
				{
					$set: {
						connections: user2Session.connections.map((connection) => ({
							...connection,
							_createdAt: new Date(connection._createdAt.getTime() - 6 * 60 * 1000),
							_updatedAt: new Date(connection._updatedAt.getTime() - 6 * 60 * 1000),
							status: UserStatus.ONLINE,
						})),
					},
				},
			);
		});

		await expect(user1Home.content.channelHeader.getByRole('button', { name: 'user2', exact: true }).getByRole('img')).toContainClass(
			'rcx-status-bullet--online',
			{ timeout: 120_000 },
		);

		await expect(user1Home.content.channelHeader.getByRole('button', { name: 'user2', exact: true }).getByRole('img')).toContainClass(
			'rcx-status-bullet--offline',
			{ timeout: 120_000 },
		);

		await user1Context.close();
		await user2Context.close();
	});
});
