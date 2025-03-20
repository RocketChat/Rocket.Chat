import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetPrivateChannel, createTargetTeam, deleteChannel, deleteTeam } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const getMentionText = (username: string, kind?: number): string => {
	if (kind === 1) {
		return `You mentioned ${username}, but they're not in this room.`;
	}
	if (kind === 2) {
		return `You mentioned ${username}, but they're not in this room. You can ask a room admin to add them.`;
	}
	if (kind === 3) {
		return `You mentioned ${username}, but they're not in this room. You let them know via DM.`;
	}
	return `Hello @${username}, how are you`;
};

test.describe.serial('Should not allow to send @all mention if permission to do so is disabled', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	let targetChannel2: string;
	test.beforeAll(async ({ api }) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'mention-all', roles: [] }] })).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		expect(
			(
				await api.post('/permissions.update', { permissions: [{ _id: 'mention-all', roles: ['admin', 'owner', 'moderator', 'user'] }] })
			).status(),
		).toBe(200);
		await deleteChannel(api, targetChannel2);
	});

	test('expect to receive an error as notification when sending @all while permission is disabled', async ({ page }) => {
		const adminPage = new HomeChannel(page);

		await test.step('create private room', async () => {
			targetChannel2 = faker.string.uuid();

			await poHomeChannel.sidenav.openNewByLabel('Channel');
			await poHomeChannel.sidenav.inputChannelName.type(targetChannel2);
			await poHomeChannel.sidenav.btnCreate.click();

			await expect(page).toHaveURL(`/group/${targetChannel2}`);
		});
		await test.step('receive notify message', async () => {
			await adminPage.content.sendMessage('@all ');
			await expect(adminPage.content.lastUserMessage).toContainText('Notify all in this room is not allowed');
		});
	});
});

test.describe.serial('Should not allow to send @here mention if permission to do so is disabled', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	let targetChannel2: string;
	test.beforeAll(async ({ api }) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'mention-here', roles: [] }] })).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		expect(
			(
				await api.post('/permissions.update', { permissions: [{ _id: 'mention-here', roles: ['admin', 'owner', 'moderator', 'user'] }] })
			).status(),
		).toBe(200);
		await deleteChannel(api, targetChannel2);
	});

	test('expect to receive an error as notification when sending here while permission is disabled', async ({ page }) => {
		const adminPage = new HomeChannel(page);

		await test.step('create private room', async () => {
			targetChannel2 = faker.string.uuid();

			await poHomeChannel.sidenav.openNewByLabel('Channel');
			await poHomeChannel.sidenav.inputChannelName.type(targetChannel2);
			await poHomeChannel.sidenav.btnCreate.click();

			await expect(page).toHaveURL(`/group/${targetChannel2}`);
		});
		await test.step('receive notify message', async () => {
			await adminPage.content.sendMessage('@here ');
			await expect(adminPage.content.lastUserMessage).toContainText('Notify all in this room is not allowed');
		});
	});
});

test.describe.serial('message-mentions', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect show "all" and "here" options', async () => {
		await poHomeChannel.sidenav.openChat('general');
		await poHomeChannel.content.inputMessage.type('@');

		await expect(poHomeChannel.content.messagePopupUsers.locator('role=listitem >> text="all"')).toBeVisible();
		await expect(poHomeChannel.content.messagePopupUsers.locator('role=listitem >> text="here"')).toBeVisible();
	});

	test.describe('users not in channel', () => {
		let targetChannel: string;
		let targetChannel2: string;
		test.beforeAll(async ({ api }) => {
			targetChannel = await createTargetPrivateChannel(api);
		});

		test.afterAll(async ({ api }) => {
			await deleteChannel(api, targetChannel);
		});

		test('all actions', async ({ page }) => {
			const adminPage = new HomeChannel(page);
			const mentionText = getMentionText(Users.user1.data.username, 1);

			await test.step('receive bot message', async () => {
				await adminPage.sidenav.openChat(targetChannel);
				await adminPage.content.sendMessage(getMentionText(Users.user1.data.username));
				await expect(adminPage.content.lastUserMessage.locator('.rcx-message-block')).toContainText(mentionText);
			});

			await test.step('show "Do nothing" action', async () => {
				await expect(adminPage.content.lastUserMessage.locator('button >> text="Do nothing"')).toBeVisible();
			});
			await test.step('show "Add them" action', async () => {
				await expect(adminPage.content.lastUserMessage.locator('button >> text="Add them"')).toBeVisible();
			});
			await test.step('show "Let them know" action', async () => {
				await expect(adminPage.content.lastUserMessage.locator('button >> text="Let them know"')).toBeVisible();
			});

			await test.step('dismiss', async () => {
				await adminPage.content.lastUserMessage.locator('button >> text="Do nothing"').click();
			});

			await test.step('receive second bot message', async () => {
				await adminPage.content.sendMessage(getMentionText(Users.user1.data.username));
				await expect(adminPage.content.lastUserMessage.locator('.rcx-message-block')).toContainText(mentionText);
			});
			await test.step('send message to users', async () => {
				await adminPage.content.lastUserMessage.locator('button >> text="Let them know"').click();
				await expect(adminPage.content.lastUserMessageBody).toContainText(getMentionText(Users.user1.data.username, 3));
			});

			await test.step('receive third bot message', async () => {
				await adminPage.content.sendMessage(getMentionText(Users.user1.data.username));
				await expect(adminPage.content.lastUserMessage.locator('.rcx-message-block')).toContainText(mentionText);
			});
			await test.step('add users to room', async () => {
				await adminPage.content.lastUserMessage.locator('button >> text="Add them"').click();
				await expect(adminPage.content.lastSystemMessageBody).toContainText('added');
			});
		});

		test.describe(() => {
			test.use({ storageState: Users.user1.state });

			test('dismiss and share message actions', async ({ page }) => {
				const mentionText = getMentionText(Users.user2.data.username, 1);
				const userPage = new HomeChannel(page);

				await test.step('receive bot message', async () => {
					await userPage.sidenav.openChat(targetChannel);
					await userPage.content.sendMessage(getMentionText(Users.user2.data.username));
					await expect(userPage.content.lastUserMessage.locator('.rcx-message-block')).toContainText(mentionText);
				});

				await test.step('show "Do nothing" action', async () => {
					await expect(userPage.content.lastUserMessage.locator('button >> text="Do nothing"')).toBeVisible();
				});
				await test.step('show "Let them know" action', async () => {
					await expect(userPage.content.lastUserMessage.locator('button >> text="Let them know"')).toBeVisible();
				});
				await test.step('not show "Add them action', async () => {
					await expect(userPage.content.lastUserMessage.locator('button >> text="Add them"')).not.toBeVisible();
				});

				await test.step('dismiss', async () => {
					await userPage.content.lastUserMessage.locator('button >> text="Do nothing"').click();
				});

				await test.step('receive second bot message', async () => {
					await userPage.sidenav.openChat(targetChannel);
					await userPage.content.sendMessage(getMentionText(Users.user2.data.username));
					await expect(userPage.content.lastUserMessage.locator('.rcx-message-block')).toContainText(mentionText);
				});
				await test.step('send message to users', async () => {
					await userPage.content.lastUserMessage.locator('button >> text="Let them know"').click();
					await expect(userPage.content.lastUserMessageBody).toContainText(getMentionText(Users.user2.data.username, 3));
				});
			});
		});

		test.describe(() => {
			test.use({ storageState: Users.user1.state });
			test.beforeAll(async ({ api }) => {
				expect((await api.post('/permissions.update', { permissions: [{ _id: 'create-d', roles: ['admin'] }] })).status()).toBe(200);
			});

			test.afterAll(async ({ api }) => {
				expect(
					(await api.post('/permissions.update', { permissions: [{ _id: 'create-d', roles: ['admin', 'user', 'bot', 'app'] }] })).status(),
				).toBe(200);
			});

			test('dismiss and add users actions', async ({ page }) => {
				const mentionText = getMentionText(Users.user2.data.username, 1);
				const userPage = new HomeChannel(page);

				await test.step('create private room', async () => {
					targetChannel2 = faker.string.uuid();

					await poHomeChannel.sidenav.openNewByLabel('Channel');
					await poHomeChannel.sidenav.inputChannelName.type(targetChannel2);
					await poHomeChannel.sidenav.btnCreate.click();

					await expect(page).toHaveURL(`/group/${targetChannel2}`);
				});

				await test.step('receive bot message', async () => {
					await userPage.sidenav.openChat(targetChannel2);
					await userPage.content.sendMessage(getMentionText(Users.user2.data.username));
					await expect(userPage.content.lastUserMessage.locator('.rcx-message-block')).toContainText(mentionText);
				});
				await test.step('show "Do nothing" action', async () => {
					await expect(userPage.content.lastUserMessage.locator('button >> text="Do nothing"')).toBeVisible();
				});
				await test.step('show "Add them" action', async () => {
					await expect(userPage.content.lastUserMessage.locator('button >> text="Add them"')).toBeVisible();
				});
				await test.step('not show "Let them know" action', async () => {
					await expect(userPage.content.lastUserMessage.locator('button >> text="Let them know"')).not.toBeVisible();
				});

				await test.step('dismiss', async () => {
					await userPage.content.lastUserMessage.locator('button >> text="Do nothing"').click();
				});

				await test.step('receive second bot message', async () => {
					await userPage.sidenav.openChat(targetChannel2);
					await userPage.content.sendMessage(getMentionText(Users.user2.data.username));
					await expect(userPage.content.lastUserMessage.locator('.rcx-message-block')).toContainText(mentionText);
				});
				await test.step('add users to room', async () => {
					await userPage.content.lastUserMessage.locator('button >> text="Add them"').click();
					await expect(userPage.content.lastSystemMessageBody).toContainText('added');
				});
			});
		});

		test.describe(() => {
			test.use({ storageState: Users.user2.state });
			test.beforeAll(async ({ api }) => {
				expect((await api.post('/permissions.update', { permissions: [{ _id: 'create-d', roles: ['admin'] }] })).status()).toBe(200);
			});

			test.afterAll(async ({ api }) => {
				expect(
					(await api.post('/permissions.update', { permissions: [{ _id: 'create-d', roles: ['admin', 'user', 'bot', 'app'] }] })).status(),
				).toBe(200);
			});
			test('no actions', async ({ page }) => {
				const userPage = new HomeChannel(page);

				await test.step('receive bot message', async () => {
					await userPage.sidenav.openChat(targetChannel2);
					await userPage.content.sendMessage(getMentionText(Users.user3.data.username));
					await expect(userPage.content.lastUserMessage.locator('.rcx-message-block')).toContainText(
						getMentionText(Users.user3.data.username, 2),
					);
				});

				await test.step('not show "Do nothing" action', async () => {
					await expect(userPage.content.lastUserMessage.locator('button >> text="Do nothing"')).not.toBeVisible();
				});
				await test.step('not show "Add them" action', async () => {
					await expect(userPage.content.lastUserMessage.locator('button >> text="Add them"')).not.toBeVisible();
				});
				await test.step('not show "Let them know" action', async () => {
					await expect(userPage.content.lastUserMessage.locator('button >> text="Let them know"')).not.toBeVisible();
				});
			});
		});

		test.describe('team mention', () => {
			let team: string;
			test.use({ storageState: Users.user1.state });
			test.beforeAll(async ({ api }) => {
				team = await createTargetTeam(api);
			});

			test.afterAll(async ({ api }) => {
				await deleteTeam(api, team);
			});

			test('should not receive bot message', async ({ page }) => {
				const userPage = new HomeChannel(page);

				await test.step('do not receive bot message', async () => {
					await userPage.sidenav.openChat(targetChannel);
					await userPage.content.sendMessage(getMentionText(team));
					await expect(userPage.content.lastUserMessage.locator('.rcx-message-block')).not.toBeVisible();
				});
			});
		});
	});
});
