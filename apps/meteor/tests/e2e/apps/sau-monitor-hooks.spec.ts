import { Emitter } from '@rocket.chat/emitter';

import { Users, restoreState } from '../fixtures/userStates';
import { test, expect } from '../utils/test';
import { sauEvents } from '../../../server/services/sauMonitor/events';
import { deviceManagementEvents } from '../../../server/services/device-management/events';
import { ISocketConnection, ISocketConnectionLogged } from '@rocket.chat/core-typings';

type EventData = {
	connection: ISocketConnectionLogged | ISocketConnection;
	userId: string;
}

function listenEvent<T = unknown>(
	emitter: Emitter,
	event: string
): Promise<T> {
	return new Promise<T>((resolve) => {
		emitter.once(event, (data: T) => resolve(data));
	});
}

test.use({ storageState: Users.user1.state });

test.describe.only('SAU Monitor Hooks Events - DDP Headers', () => {
	test.describe('Accounts.onLogin', () => {
		test.beforeAll(async () => {})

		test.afterAll(async () => {})

		test('Should extract headers correctly on new connection', async ({ page }) => {
			await restoreState(page, Users.user1);
			const eventData = await listenEvent<EventData>(sauEvents, 'accounts.login');
			expect(eventData.connection.httpHeaders).toBeDefined();
			expect(eventData.userId).toBe(Users.user1.data._id);
		});

		test('Should send loginToken when resume token is used', async ({ page }) => {
			await restoreState(page, Users.user1);
			const eventData = await listenEvent<EventData>(sauEvents, 'accounts.login');
			expect(eventData.connection.loginToken).toBeDefined();
		});

		test('Should emit accounts.login & device-login with the correct header information', async ({ page }) => {
			await restoreState(page, Users.user1);
			const sauLogin = await listenEvent<EventData>(sauEvents, 'accounts.login');
			const deviceLogin = await listenEvent<EventData>(deviceManagementEvents, 'device-login');
			expect(sauLogin.connection.httpHeaders).toBeDefined();
			expect(deviceLogin.connection.httpHeaders).toBeDefined();
		});
	});

	test.describe('Accounts.onLogout', () => {
		test('Should extract headers correctly on logout', async ({ page }) => {
			await restoreState(page, Users.user1);
			await page.evaluate(() => localStorage.clear()); // Simulate logout
			const eventData = await listenEvent<EventData>(sauEvents, 'accounts.logout');
			expect(eventData.connection.httpHeaders).toBeDefined();
		});

		test('Should emit accounts.logout with the correct header information', async ({ page }) => {
			await restoreState(page, Users.user1);
			await page.evaluate(() => localStorage.clear());
			const eventData = await listenEvent<EventData>(sauEvents, 'accounts.logout');
			expect(eventData.userId).toBe(Users.user1.data._id);
			expect(eventData.connection.httpHeaders).toBeDefined();
		});
	});

	test.describe('Meteor.onConnection', () => {
		test('Should emit socket.disconnected with the correct header information', async ({ browser }) => {
			const context = await browser.newContext({ storageState: Users.user1.state });
			const page = await context.newPage();
			await page.goto('/home');
			await page.close();
			const eventData = await listenEvent<EventData>(sauEvents, 'socket.disconnected');
			expect(eventData.connection.httpHeaders).toBeDefined();
		});

		test('Should emit socket.connect with the correct header information', async ({ browser }) => {
			const context = await browser.newContext({ storageState: Users.user1.state });
			const page = await context.newPage();
			await page.goto('/home');
			const eventData = await listenEvent<EventData>(sauEvents, 'socket.connected');
			expect(eventData.connection.httpHeaders).toBeDefined();
		});
	});
});
