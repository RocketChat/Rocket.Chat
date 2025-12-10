import { UserStatus, type IUserSessionConnection } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.describe('Should remove stale sessions', () => {
	test('user1 sees user2 offline after inactivity', async ({ browser, db }) => {
		const user1Context = await browser.newContext({ storageState: Users.user1.state });
		const user1Page = await user1Context.newPage();
		const user1Home = new HomeChannel(user1Page);

		const user2Context = await browser.newContext({ storageState: Users.user2.state });
		const user2Page = await user2Context.newPage();
		const user2Home = new HomeChannel(user2Page);

		await user2Page.goto('/home');
		await user1Page.goto('/home');

		await user2Home.sidenav.openChat('user1');
		await user1Home.sidenav.openChat('user2');

		await expect(user2Home.content.channelHeader).toContainText('user1');
		await expect(user2Home.content.channelHeader.locator('.rcx-status-bullet--online')).toBeVisible();

		await expect(user1Home.content.channelHeader).toContainText('user2');
		await expect(user1Home.content.channelHeader.locator('.rcx-status-bullet--online')).toBeVisible();

		const user2Session = (await db.usersSessions.findOneById(Users.user2.data._id)) ?? {
			_id: Users.user2.data._id,
			connections: [] as IUserSessionConnection[],
		};

		expect(user2Session.connections.length).toBeGreaterThan(0);

		await test.step('Close user2 page to simulate disconnection', async () => {
			await user2Context.setOffline(true);
		});

		await test.step('Simulate inactivity by updating user2 session and status', async () => {
			await db.users.updateStatusById(Users.user2.data._id, {
				status: UserStatus.ONLINE,
				statusConnection: UserStatus.ONLINE,
			});

			await db.usersSessions.updateOne(
				{ _id: Users.user2.data._id },
				{
					$set: {
						connections: user2Session.connections.map((connection) => ({
							...connection,
							_updatedAt: new Date(connection._updatedAt.getTime() - 6 * 60 * 1000),
						})),
					},
				},
			);
		});

		// Wait for presence to update

		await expect(user1Home.content.channelHeader.getByRole('button', { name: 'user2', exact: true }).getByRole('img')).toContainClass(
			'rcx-status-bullet--offline',
			{ timeout: 60_000 },
		);

		await user1Context.close();
	});
});
