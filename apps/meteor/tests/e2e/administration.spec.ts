import { faker } from '@faker-js/faker';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { AdminUsers, AdminRoles, AdminRooms, AdminThirdPartyLogin, AdminIntegrations } from './page-objects';
import { ToastMessages } from './page-objects/fragments';
import { createTargetChannel, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.parallel('administration', () => {
	let targetChannel: string;

	test.describe('Workspace', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/info');
		});

		test('expect download info as JSON', async ({ page }) => {
			const [download] = await Promise.all([page.waitForEvent('download'), page.locator('button:has-text("Download info")').click()]);

			await expect(download.suggestedFilename()).toBe('statistics.json');
		});
	});

	test.describe('Engagement dashboard', () => {
		test('Should show upsell modal', async ({ page }) => {
			test.skip(IS_EE);
			await page.goto('/admin/engagement/users');

			await expect(page.locator('role=dialog[name="Engagement dashboard"]')).toBeVisible();
		});

		test('Should show engagement dashboard', async ({ page }) => {
			test.skip(!IS_EE);
			await page.goto('/admin/engagement/users');

			await expect(page.locator('h1 >> text="Engagement"')).toBeVisible();
		});
	});

	test.describe('Device management', () => {
		test('Should show upsell modal', async ({ page }) => {
			test.skip(IS_EE);
			await page.goto('/admin/device-management');

			await expect(page.locator('role=dialog[name="Device management"]')).toBeVisible();
		});

		test('Should show device management page', async ({ page }) => {
			test.skip(!IS_EE);
			await page.goto('/admin/device-management');

			await expect(page.locator('h1 >> text="Device management"')).toBeVisible();
		});
	});

	test.describe('Users', () => {
		let poAdminUsers: AdminUsers;
		test.beforeEach(async ({ page }) => {
			poAdminUsers = new AdminUsers(page);

			await page.goto('/admin/users');
		});

		test('expect find "user1" user', async () => {
			await poAdminUsers.searchUser('user1');
		});

		test('expect create a user', async () => {
			await poAdminUsers.btnNewUser.click();
			await poAdminUsers.editUser.inputEmail.fill(faker.internet.email());
			await poAdminUsers.editUser.inputName.fill(faker.person.firstName());
			await poAdminUsers.editUser.inputUserName.fill(faker.internet.userName());
			await poAdminUsers.editUser.inputSetManually.click();
			await poAdminUsers.editUser.inputPassword.fill('P@ssw0rd1234.!');
			await poAdminUsers.editUser.inputConfirmPassword.fill('P@ssw0rd1234.!');
			await expect(poAdminUsers.editUser.userRole).toBeVisible();
			await poAdminUsers.editUser.btnAddUser.click();
		});

		test('expect SMTP setup warning and routing to email settings', async ({ page }) => {
			await poAdminUsers.btnInvite.click();
			await poAdminUsers.editUser.setupSmtpLink.click();
			await expect(page).toHaveURL('/admin/settings/Email');
		});

		test('expect to show join default channels option only when creating new users, not when editing users', async () => {
			const username = faker.internet.userName();

			await poAdminUsers.btnNewUser.click();
			await poAdminUsers.editUser.inputName.type(faker.person.firstName());
			await poAdminUsers.editUser.inputUserName.type(username);
			await poAdminUsers.editUser.inputEmail.type(faker.internet.email());
			await poAdminUsers.editUser.inputSetManually.click();
			await poAdminUsers.editUser.inputPassword.type('P@ssw0rd1234.!');
			await poAdminUsers.editUser.inputConfirmPassword.type('P@ssw0rd1234.!');
			await expect(poAdminUsers.editUser.userRole).toBeVisible();
			await expect(poAdminUsers.editUser.joinDefaultChannels).toBeVisible();
			await poAdminUsers.editUser.btnAddUser.click();

			await poAdminUsers.searchUser(username);
			await poAdminUsers.getUserRowByUsername(username).click();
			await poAdminUsers.userInfo.btnEdit.click();
			await expect(poAdminUsers.editUser.inputUserName).toHaveValue(username);
			await expect(poAdminUsers.editUser.joinDefaultChannels).not.toBeVisible();
		});

		test.describe('Delete user', () => {
			const nonEmptyChannelName = faker.string.uuid();
			const emptyChannelName = faker.string.uuid();
			let ownerUser: IUser;
			let user: IUser;
			let poToastMessage: ToastMessages;

			test.beforeEach(({ page }) => {
				poToastMessage = new ToastMessages(page);
			});

			test.beforeAll(async ({ api }) => {
				const createUserResponse = await api.post('/users.create', {
					email: faker.internet.email(),
					name: faker.person.fullName(),
					password: faker.internet.password(),
					username: faker.internet.userName(),
				});

				user = (await createUserResponse.json()).user;

				const createOwnerUserResponse = await api.post('/users.create', {
					email: faker.internet.email(),
					name: faker.person.fullName(),
					password: faker.internet.password(),
					username: faker.internet.userName(),
				});

				ownerUser = (await createOwnerUserResponse.json()).user;

				// TODO: refactor createChannel utility in order to get channel data when creating
				const response = await api.post('/channels.create', { name: nonEmptyChannelName, members: [ownerUser.username] });
				const { channel: nonEmptyChannel } = await response.json();

				await api.post('/channels.addOwner', { roomId: nonEmptyChannel._id, username: ownerUser.username });
				await api.post('/channels.removeOwner', { roomId: nonEmptyChannel._id, userId: Users.admin.data._id });

				// TODO: refactor createChannel utility in order to get channel data when creating
				const res = await api.post('/groups.create', { name: emptyChannelName, members: [ownerUser.username] });
				const { group: emptyRoom } = await res.json();

				await api.post('/groups.addOwner', { roomId: emptyRoom._id, username: ownerUser.username });
				await api.post('/groups.leave', { roomId: emptyRoom._id });
			});

			test('expect to show owner change modal, when deleting last owner of any room', async ({ page }) => {
				await poAdminUsers.deleteUser(ownerUser.username);
				await expect(page.getByRole('dialog', { name: 'Are you sure?' })).toBeVisible();

				await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
				await expect(page.getByRole('dialog', { name: 'Are you sure?' })).toContainText(
					`A new owner will be assigned automatically to the ${nonEmptyChannelName} room.`,
				);
				await expect(page.getByRole('dialog', { name: 'Are you sure?' })).toContainText(
					`The empty room ${emptyChannelName} will be removed automatically.`,
				);
				await expect(page.getByRole('dialog').getByRole('button', { name: 'Delete' })).toBeVisible();

				await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
				await poToastMessage.waitForDisplay();
				await expect(page.getByRole('heading', { name: 'No users' })).toBeVisible();
			});

			test('expect to delete user', async ({ page }) => {
				await poAdminUsers.deleteUser(user.username);
				await expect(page.getByRole('dialog', { name: 'Are you sure?' })).toBeVisible();

				await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();

				await poToastMessage.waitForDisplay();
				await expect(page.getByRole('heading', { name: 'No users' })).toBeVisible();
			});
		});
	});

	// TODO: Move this suit to admin-rooms.spec.ts
	test.describe('Rooms', () => {
		let poAdminRooms: AdminRooms;
		test.beforeAll(async ({ api }) => {
			targetChannel = await createTargetChannel(api);
		});
		test.beforeEach(async ({ page }) => {
			poAdminRooms = new AdminRooms(page);
			await page.goto('/admin/rooms');
		});

		test('should find "general" channel', async ({ page }) => {
			await poAdminRooms.inputSearchRooms.type('general');
			await page.waitForSelector('[qa-room-id="GENERAL"]');
		});

		test('should edit target channel name', async () => {
			await poAdminRooms.inputSearchRooms.fill(targetChannel);
			await poAdminRooms.getRoomRow(targetChannel).click();
			await poAdminRooms.editRoom.roomNameInput.fill(`${targetChannel}-edited`);
			await poAdminRooms.editRoom.btnSave.click();

			await expect(poAdminRooms.getRoomRow(targetChannel)).toContainText(`${targetChannel}-edited`);

			targetChannel = `${targetChannel}-edited`;
		});

		test('should edit target channel type', async () => {
			await poAdminRooms.inputSearchRooms.type(targetChannel);
			await poAdminRooms.getRoomRow(targetChannel).click();
			await poAdminRooms.editRoom.privateLabel.click();
			await poAdminRooms.editRoom.btnSave.click();
			await expect(poAdminRooms.getRoomRow(targetChannel)).toContainText('Private Channel');
		});

		test('should archive target channel', async () => {
			await poAdminRooms.inputSearchRooms.type(targetChannel);
			await poAdminRooms.getRoomRow(targetChannel).click();
			await poAdminRooms.editRoom.archivedLabel.click();
			await poAdminRooms.editRoom.btnSave.click();

			await poAdminRooms.getRoomRow(targetChannel).click();
			await expect(poAdminRooms.editRoom.archivedInput).toBeChecked();
		});

		test.describe.serial('Default rooms', () => {
			test('expect target channel to be default', async () => {
				await poAdminRooms.inputSearchRooms.type(targetChannel);
				await poAdminRooms.getRoomRow(targetChannel).click();
				await poAdminRooms.editRoom.defaultLabel.click();

				await test.step('should close contextualbar after saving', async () => {
					await poAdminRooms.editRoom.btnSave.click();
					await poAdminRooms.editRoom.waitForDismissal();
				});

				await poAdminRooms.getRoomRow(targetChannel).click();
				await expect(poAdminRooms.editRoom.defaultInput).toBeChecked();
			});

			test('should mark target default channel as "favorite by default"', async () => {
				await poAdminRooms.inputSearchRooms.fill(targetChannel);
				await poAdminRooms.getRoomRow(targetChannel).click();
				await poAdminRooms.editRoom.favoriteLabel.click();
				await poAdminRooms.editRoom.btnSave.click();
				await expect(poAdminRooms.editRoom.btnSave).not.toBeVisible();

				await poAdminRooms.getRoomRow(targetChannel).click();
				await expect(poAdminRooms.editRoom.favoriteInput).toBeChecked();
			});

			test('should see favorite switch disabled when default is not true', async () => {
				await poAdminRooms.inputSearchRooms.fill(targetChannel);
				await poAdminRooms.getRoomRow(targetChannel).click();
				await poAdminRooms.editRoom.defaultLabel.click();

				await expect(poAdminRooms.editRoom.favoriteInput).toBeDisabled();
			});

			test('should see favorite switch enabled when default is true', async () => {
				await poAdminRooms.inputSearchRooms.type(targetChannel);
				await poAdminRooms.getRoomRow(targetChannel).click();

				await expect(poAdminRooms.editRoom.favoriteInput).toBeEnabled();
			});
		});
	});

	test.describe('Permissions', () => {
		let poAdminRoles: AdminRoles;
		test.beforeEach(async ({ page }) => {
			poAdminRoles = new AdminRoles(page);
			await page.goto('/admin/permissions');
		});

		test('expect open upsell modal if not enterprise', async ({ page }) => {
			test.skip(IS_EE);
			await poAdminRoles.btnCreateRole.click();
			await expect(page.getByRole('dialog', { name: 'Custom roles' })).toBeVisible();
		});

		test.describe('Users in role', () => {
			const channelName = faker.string.uuid();
			test.beforeAll(async ({ api }) => {
				// TODO: refactor createChannel utility in order to get channel data when creating
				const response = await api.post('/channels.create', { name: channelName, members: ['user1'] });
				const { channel } = await response.json();

				await api.post('/channels.addOwner', { roomId: channel._id, userId: Users.user1.data._id });
				await api.post('/channels.removeOwner', { roomId: channel._id, userId: Users.admin.data._id });
			});

			test('admin should be able to get the owners of a room that wasnt created by him', async ({ page }) => {
				await poAdminRoles.openRoleByName('Owner').click();
				await poAdminRoles.btnUsersInRole.click();
				await poAdminRoles.inputRoom.fill(channelName);
				await page.getByRole('option', { name: channelName }).click();

				await expect(poAdminRoles.getUserInRoleRowByUsername('user1')).toBeVisible();
			});

			test('should add user1 as moderator of target channel', async ({ page }) => {
				await poAdminRoles.openRoleByName('Moderator').click();
				await poAdminRoles.btnUsersInRole.click();

				await poAdminRoles.inputRoom.fill(channelName);
				await page.getByRole('option', { name: channelName }).click();

				await poAdminRoles.inputUsers.pressSequentially('user1');
				await page.getByRole('option', { name: 'user1' }).click();
				await poAdminRoles.btnAdd.click();

				await expect(poAdminRoles.getUserInRoleRowByUsername('user1')).toBeVisible();
			});

			test('should remove user1 as moderator of target channel', async ({ page }) => {
				await poAdminRoles.openRoleByName('Moderator').click();
				await poAdminRoles.btnUsersInRole.click();

				await poAdminRoles.inputRoom.fill(channelName);
				await page.getByRole('option', { name: channelName }).click();

				await poAdminRoles.removeUserFromRoleByUsername('user1');
				await expect(page.locator('h3 >> text="No results found"')).toBeVisible();
			});

			test('should back to the permissions page', async ({ page }) => {
				await poAdminRoles.openRoleByName('Moderator').click();
				await poAdminRoles.btnUsersInRole.click();
				await poAdminRoles.btnBack.click();

				await expect(page.locator('h1 >> text="Permissions"')).toBeVisible();
			});
		});
	});

	test.describe('Mailer', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/mailer');
		});

		test('should not have any accessibility violations', async ({ makeAxeBuilder }) => {
			const results = await makeAxeBuilder().analyze();
			expect(results.violations).toEqual([]);
		});
	});

	test.describe.serial('Third party login', () => {
		let poAdminThirdPartyLogin: AdminThirdPartyLogin;
		const appName = faker.string.uuid();
		const appRedirectURI = faker.internet.url();

		test.beforeEach(async ({ page }) => {
			await page.goto('/admin/third-party-login');
			poAdminThirdPartyLogin = new AdminThirdPartyLogin(page);
		});

		test('should show Third-party login page', async ({ page }) => {
			await page.goto('/admin/third-party-login');

			await expect(page.locator('h1 >> text="Third-party login"')).toBeVisible();
		});

		test('should not be able to create a new application without application name', async ({ page }) => {
			await poAdminThirdPartyLogin.btnNewApplication.click();
			await poAdminThirdPartyLogin.inputRedirectURI.fill(appRedirectURI);
			await poAdminThirdPartyLogin.btnSave.click();

			await expect(page.getByText('Name required')).toBeVisible();
		});

		test('should not be able to create a new application without redirect URI', async ({ page }) => {
			await poAdminThirdPartyLogin.btnNewApplication.click();
			await poAdminThirdPartyLogin.inputApplicationName.fill(appName);
			await poAdminThirdPartyLogin.btnSave.click();

			await expect(page.getByText('Redirect URI required')).toBeVisible();
		});

		test('should be able to create a new application', async ({ page }) => {
			await poAdminThirdPartyLogin.btnNewApplication.click();
			await poAdminThirdPartyLogin.inputApplicationName.fill(appName);
			await poAdminThirdPartyLogin.inputRedirectURI.fill(appRedirectURI);
			await poAdminThirdPartyLogin.btnSave.click();

			await expect(poAdminThirdPartyLogin.getThirdPartyAppByName(appName)).toBeVisible();
			await expect(page.getByText('Application added')).toBeVisible();
		});

		test('should be able see aplication fields', async () => {
			await poAdminThirdPartyLogin.getThirdPartyAppByName(appName).click();
			await expect(poAdminThirdPartyLogin.inputApplicationName).toBeVisible();
			await expect(poAdminThirdPartyLogin.inputRedirectURI).toBeVisible();
			await expect(poAdminThirdPartyLogin.inputClientId).toBeVisible();
			await expect(poAdminThirdPartyLogin.inputClientSecret).toBeVisible();
			await expect(poAdminThirdPartyLogin.inputAuthUrl).toBeVisible();
			await expect(poAdminThirdPartyLogin.inputTokenUrl).toBeVisible();
		});

		test('should be able to delete an application', async ({ page }) => {
			await poAdminThirdPartyLogin.deleteThirdPartyAppByName(appName);

			await expect(poAdminThirdPartyLogin.getThirdPartyAppByName(appName)).not.toBeVisible();
			await expect(page.getByText('Your entry has been deleted.')).toBeVisible();
		});
	});

	test.describe('Integrations', () => {
		let poAdminIntegrations: AdminIntegrations;

		const messageCodeHighlightDefault =
			'javascript,css,markdown,dockerfile,json,go,rust,clean,bash,plaintext,powershell,scss,shell,yaml,vim';
		const incomingIntegrationName = faker.string.uuid();

		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Code_highlight', '');
		});

		test.beforeEach(async ({ page }) => {
			poAdminIntegrations = new AdminIntegrations(page);
			await page.goto('/admin/integrations');
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Message_Code_highlight', messageCodeHighlightDefault);
		});

		test('should display the example payload correctly', async () => {
			await poAdminIntegrations.btnNew.click();
			await poAdminIntegrations.btnInstructions.click();

			await expect(poAdminIntegrations.codeExamplePayload('Loading')).not.toBeVisible();
		});

		test('should be able to create new incoming integration', async () => {
			await poAdminIntegrations.btnNew.click();
			await poAdminIntegrations.inputName.fill(incomingIntegrationName);
			await poAdminIntegrations.inputPostToChannel.fill('#general');
			await poAdminIntegrations.inputPostAs.fill(Users.admin.data.username);
			await poAdminIntegrations.btnSave.click();

			await expect(poAdminIntegrations.inputWebhookUrl).not.toHaveValue('Will be available here after saving.');

			await poAdminIntegrations.btnBack.click();
			await expect(poAdminIntegrations.getIntegrationByName(incomingIntegrationName)).toBeVisible();
		});

		test('should be able to delete an incoming integration', async () => {
			await poAdminIntegrations.deleteIntegrationByName(incomingIntegrationName);
			await expect(poAdminIntegrations.getIntegrationByName(incomingIntegrationName)).not.toBeVisible();
		});
	});
});
