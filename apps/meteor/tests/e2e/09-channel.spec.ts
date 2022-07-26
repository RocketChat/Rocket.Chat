import { test, expect } from '@playwright/test';

import { publicChannelCreated, setPublicChannelCreated } from './utils/mocks/checks';
import { Auth, HomeChannel } from './page-objects';

const anyUser = 'rocket.cat';
const anyChannelName = `channel-test-${Date.now()}`;

let hasUserAddedInChannel = false;

test.describe('Channel', () => {
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);

		await pageAuth.doLogin();

		if (!publicChannelCreated) {
			await pageHomeChannel.sidenav.doCreateChannel(anyChannelName, false);
			setPublicChannelCreated(true);
		}

		await pageHomeChannel.sidenav.doOpenChat('general');
	});

	test.describe('Search', () => {
		test.describe('SpotlightSearch', async () => {
			test('expect go to general', async () => {
				await pageHomeChannel.sidenav.doOpenChat('general');
				await expect(pageHomeChannel.content.channelTitle('general')).toContainText('general');
			});

			test('expect go to the user created channel', async () => {
				await pageHomeChannel.sidenav.doOpenChat(anyChannelName);
				await expect(pageHomeChannel.content.channelTitle(anyChannelName)).toContainText(anyChannelName);
			});
		});

		test.describe('SideNav Channel List', () => {
			test('expect go to the general channel', async () => {
				await pageHomeChannel.content.inputMain.click();
				await pageHomeChannel.sidenav.doOpenChat('general');
			});

			test('expect go to the user created channel', async () => {
				await pageHomeChannel.content.inputMain.click();
				await pageHomeChannel.sidenav.doOpenChat(anyChannelName);
			});
		});
	});

	test.describe('Usage', () => {
		test('expect add people to the room', async ({ page }) => {
			await pageHomeChannel.sidenav.doOpenChat(anyChannelName);

			await pageHomeChannel.tabs.btnTabMembers.click();
			await pageHomeChannel.tabs.doAddPeopleToChannel(anyUser);
			hasUserAddedInChannel = true;
			await expect(page.locator('.rcx-toastbar.rcx-toastbar--success')).toBeVisible();
		});

		test.describe('Channel settings]:', async () => {
			test('expect edit the topic input', async () => {
				await pageHomeChannel.tabs.btnTabInfo.click();
				await pageHomeChannel.tabs.editNameBtn.click();

				await pageHomeChannel.tabs.editTopicTextInput.fill('TOPIC EDITED');
				await pageHomeChannel.tabs.editNameSave.click();

				await expect(pageHomeChannel.tabs.secondSetting('TOPIC EDITED')).toBeVisible();
			});

			test('expect edit the announcement input', async () => {
				await pageHomeChannel.tabs.btnTabInfo.click();
				await pageHomeChannel.tabs.editNameBtn.click();

				await pageHomeChannel.tabs.editAnnouncementTextInput.type('ANNOUNCEMENT EDITED');
				await pageHomeChannel.tabs.editNameSave.click();

				await expect(pageHomeChannel.tabs.thirdSetting).toHaveText('ANNOUNCEMENT EDITED');
			});

			test('expect edit the description input', async () => {
				await pageHomeChannel.tabs.btnTabInfo.click();
				await pageHomeChannel.tabs.editNameBtn.click();

				await pageHomeChannel.tabs.editDescriptionTextInput.type('DESCRIPTION EDITED');
				await pageHomeChannel.tabs.editNameSave.click();
				await pageHomeChannel.tabs.mainSideBarBack.click();

				await expect(pageHomeChannel.tabs.fourthSetting).toHaveText('DESCRIPTION EDITED');
			});
		});

		test.describe('Members tab usage]:', async () => {
			test.describe('User muted', async () => {
				test.beforeEach(async () => {
					if (!hasUserAddedInChannel) {
						await pageHomeChannel.tabs.btnTabMembers.click();
						await pageHomeChannel.tabs.doAddPeopleToChannel(anyUser);
						await pageHomeChannel.tabs.btnTabMembers.click();
					}
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test.afterEach(async () => {
					await pageHomeChannel.doDismissToast();
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test('expect mute "anyUser"', async () => {
					await pageHomeChannel.tabs.doMuteUser(anyUser);
				});
			});

			test.describe('Owner added', async () => {
				test.beforeEach(async () => {
					if (!hasUserAddedInChannel) {
						await pageHomeChannel.tabs.btnTabMembers.click();
						await pageHomeChannel.tabs.doAddPeopleToChannel(anyUser);
						await pageHomeChannel.tabs.btnTabMembers.click();
					}
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test.afterEach(async () => {
					await pageHomeChannel.doDismissToast();
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test('expect set "anyUser" as owner', async () => {
					await pageHomeChannel.tabs.doSetUserOwner(anyUser);
					await pageHomeChannel.doDismissToast();
					await expect(pageHomeChannel.content.lastMessageRoleAdded).toContainText(anyUser);
				});
			});

			test.describe('Moderator added', async () => {
				test.beforeEach(async () => {
					if (!hasUserAddedInChannel) {
						await pageHomeChannel.tabs.btnTabMembers.click();
						await pageHomeChannel.tabs.doAddPeopleToChannel(anyUser);
						await pageHomeChannel.tabs.btnTabMembers.click();
					}
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test.afterEach(async () => {
					await pageHomeChannel.doDismissToast();
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test('expect set "anyUser" as moderator', async () => {
					await pageHomeChannel.tabs.doSetUserModerator(anyUser);
					await expect(pageHomeChannel.content.lastMessageRoleAdded).toContainText(anyUser);
				});
			});

			test('expect edit channel name', async () => {
				await pageHomeChannel.tabs.btnTabInfo.click();
				await pageHomeChannel.tabs.editNameBtn.click();
				await pageHomeChannel.tabs.editNameTextInput.fill(`NAME-EDITED-${anyChannelName}`);
				await pageHomeChannel.tabs.editNameSave.click();
			});

			test('expect to find and open with new name', async () => {
				await pageHomeChannel.sidenav.doOpenChat(`NAME-EDITED-${anyChannelName}`);
			});
		});
	});
});
