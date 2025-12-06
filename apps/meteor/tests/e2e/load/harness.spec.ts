/* eslint-disable no-await-in-loop */
import type { BrowserContext, Page } from '@playwright/test';

import { DEFAULT_USER_CREDENTIALS } from '../config/constants';
import { Registration, HomeChannel } from '../page-objects';
import { getLoadConfig } from './config';
import { createTargetChannelAndReturnFullRoom, deleteRoom } from '../utils/create-target-channel';
import { DatabaseClient } from '../utils/db';
import { test, expect } from '../utils/test';
import { createTestUsers, type ITestUser } from '../utils/user-helpers';

const config = getLoadConfig();

test.describe('Playwright Load Harness', () => {
	let channelId: string;
	let channelName: string;
	let users: ITestUser[] = [];
	let db: DatabaseClient;

	test.beforeAll(async () => {
		db = await DatabaseClient.connect();
	});

	test.afterAll(async () => {
		await db.close();
	});

	test.beforeAll(async ({ api }) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api);
		channelId = channel._id;
		channelName = channel.name ?? 'load-channel';

		users = await createTestUsers(api, config.users);

		await Promise.all(
			users.map((user) =>
				api.post('/channels.invite', {
					roomId: channelId,
					userId: user.data._id,
				}),
			),
		);
	});

	test.afterAll(async ({ api }) => {
		const results = await Promise.allSettled(users.map((user) => user.delete()));
		const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
		if (failures.length) {
			console.error('Some test users were not deleted successfully:');
			for (const failure of failures) {
				console.error(failure.reason);
			}
		}
		if (channelId) {
			await deleteRoom(api, channelId);
		}
	});

	test(`runs load scenarios for ${config.users} users`, async ({ browser }) => {
		const results = await Promise.allSettled(
			users.map(async (user, index) =>
				runUserScenario({
					context: await browser.newContext(),
					user,
					channelName,
					index,
					config,
					db,
				}),
			),
		);

		const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
		if (failures.length) {
			throw failures[0].reason;
		}

		const successful = results
			.filter((result): result is PromiseFulfilledResult<ScenarioSummary> => result.status === 'fulfilled')
			.map((result) => result.value);

		console.log(
			JSON.stringify(
				{
					config,
					results: successful,
				},
				null,
				2,
			),
		);

		expect(successful).toHaveLength(users.length);
	});
});

type ScenarioSummary = {
	username: string;
	iterations: number;
	durations: number[];
};

type ScenarioOptions = {
	context: BrowserContext;
	user: ITestUser;
	channelName: string;
	index: number;
	config: ReturnType<typeof getLoadConfig>;
	db: DatabaseClient;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runUserScenario({ context, user, channelName, index, config, db }: ScenarioOptions): Promise<ScenarioSummary> {
	if (config.rampDelayMs) {
		await delay(index * config.rampDelayMs);
	}

	const page = await context.newPage();
	const registration = new Registration(page);
	const home = new HomeChannel(page);
	let userSession;

	try {
		await home.goto();
		await loginUser(page, registration, user.data.username);
		await home.sidenav.openChat(channelName);

		const durations: number[] = [];
		userSession = await db.usersSessions.findOneById(user.data._id);

		for (let iteration = 0; iteration < config.iterations; iteration += 1) {
			const iterationStart = Date.now();
			const messageContent = `${config.messageTemplate}::${user.data.username}::${iteration}`;

			await home.content.sendMessage(messageContent);

			durations.push(Date.now() - iterationStart);

			if (config.pauseBetweenIterationsMs) {
				await page.waitForTimeout(config.pauseBetweenIterationsMs);
			}
		}

		return {
			username: user.data.username,
			iterations: config.iterations,
			durations,
		};
	} finally {
		try {
			await context.close();
		} catch (error) {
			console.error(`Error closing context for user ${user.data.username}:`, error);
		}

		if (userSession?.connections?.length) {
			await db.usersSessions.updateOne(
				{ _id: user.data._id },
				{
					$set: {
						connections: userSession.connections.map((connection) => {
							return {
								...connection,
								_createdAt: new Date(connection._createdAt.getTime() - 300_000),
								_updatedAt: new Date(connection._updatedAt.getTime() - 300_000),
							};
						}),
					},
				},
			);
		}
	}
}

async function loginUser(page: Page, registration: Registration, username: string) {
	await registration.username.fill(username);
	await registration.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
	await registration.btnLogin.click();
	await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
}
