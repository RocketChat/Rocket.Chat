import { test, expect, Page } from '@playwright/test';

import { publicChannelCreated, setPublicChannelCreated } from './utils/mocks/checks';
import { Auth, HomeChannel } from './page-objects';

const anyUser = 'rocket.cat';
const anyChannelName = `channel-test-${Date.now()}`;

let hasUserAddedInChannel = false;

test.describe('Channel', () => {
	let page: Page;
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
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
			test.beforeAll(async () => {
				await pageHomeChannel.content.inputMain.click();
			});

			test('expect go to the general channel', async () => {
				await pageHomeChannel.sidenav.doOpenChat('general');
			});

			test('expect go to the user created channel', async () => {
				await pageHomeChannel.sidenav.doOpenChat(anyChannelName);
			});
		});
	});

	test.describe('Usage', () => {
		test.beforeAll(async () => {
			await pageHomeChannel.sidenav.doOpenChat(anyChannelName);
		});

		test.describe('Adding a user to the room:', async () => {
			test.beforeAll(async () => {
				await pageHomeChannel.doDismissToast();
				await pageHomeChannel.tabs.btnTabMembers.click();
			});

			test.afterAll(async () => {
				await pageHomeChannel.doDismissToast();
				await pageHomeChannel.tabs.btnTabMembers.click();
			});

			test('expect add people to the room', async () => {
				await pageHomeChannel.tabs.doAddPeopleToChannel(anyUser);
				hasUserAddedInChannel = true;
				await expect(page.locator('.rcx-toastbar.rcx-toastbar--success')).toBeVisible();
			});
		});

		test.describe('Channel settings]:', async () => {
			test.describe('Channel topic edit', async () => {
				test.beforeAll(async () => {
					await pageHomeChannel.tabs.btnTabInfo.click();
					await pageHomeChannel.tabs.editNameBtn.click();
				});

				test.afterAll(async () => {
					await pageHomeChannel.doDismissToast();
					if (await pageHomeChannel.tabs.mainSideBar.isVisible()) {
						await pageHomeChannel.tabs.mainSideBarClose.click();
					}
				});

				test('expect edit the topic input', async () => {
					await pageHomeChannel.tabs.editTopicTextInput.fill('TOPIC EDITED');
				});

				test('expect save the topic', async () => {
					await pageHomeChannel.tabs.editNameSave.click();
				});

				test('expect show the new topic', async () => {
					await expect(pageHomeChannel.tabs.secondSetting('TOPIC EDITED')).toBeVisible();
				});
			});

			test.describe('Channel announcement edit', async () => {
				test.beforeAll(async () => {
					await pageHomeChannel.tabs.btnTabInfo.click();
					await pageHomeChannel.tabs.editNameBtn.click();
				});

				test.afterAll(async () => {
					await pageHomeChannel.doDismissToast();
					if (await pageHomeChannel.tabs.mainSideBar.isVisible()) {
						await pageHomeChannel.tabs.mainSideBarClose.click();
					}
				});

				test('expect edit the announcement input', async () => {
					await pageHomeChannel.tabs.editAnnouncementTextInput.type('ANNOUNCEMENT EDITED');
				});

				test('expect save the announcement', async () => {
					await pageHomeChannel.tabs.editNameSave.click();
				});

				test('expect show the new announcement', async () => {
					await expect(pageHomeChannel.tabs.thirdSetting).toHaveText('ANNOUNCEMENT EDITED');
				});
			});

			test.describe('Channel description edit', async () => {
				test.beforeAll(async () => {
					await pageHomeChannel.tabs.btnTabInfo.click();
					await pageHomeChannel.tabs.editNameBtn.click();
				});

				test.afterAll(async () => {
					await pageHomeChannel.doDismissToast();
					if (await pageHomeChannel.tabs.mainSideBar.isVisible()) {
						await pageHomeChannel.tabs.mainSideBarClose.click();
					}
				});

				test('expect edit the description input', async () => {
					await pageHomeChannel.tabs.editDescriptionTextInput.type('DESCRIPTION EDITED');
				});

				test('expect save the description', async () => {
					await pageHomeChannel.tabs.editNameSave.click();
				});

				test('expect show the new description', async () => {
					await pageHomeChannel.tabs.mainSideBarBack.click();
					await expect(pageHomeChannel.tabs.fourthSetting).toHaveText('DESCRIPTION EDITED');
				});
			});
		});

		test.describe('Members tab usage]:', async () => {
			test.describe('User muted', async () => {
				test.beforeAll(async () => {
					if (!hasUserAddedInChannel) {
						await pageHomeChannel.tabs.btnTabMembers.click();
						await pageHomeChannel.tabs.doAddPeopleToChannel(anyUser);
						await pageHomeChannel.tabs.btnTabMembers.click();
					}
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test.afterAll(async () => {
					await pageHomeChannel.doDismissToast();
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test('expect mute "anyUser"', async () => {
					await pageHomeChannel.tabs.doMuteUser(anyUser);
				});
			});

			test.describe('Owner added', async () => {
				test.beforeAll(async () => {
					if (!hasUserAddedInChannel) {
						await pageHomeChannel.tabs.btnTabMembers.click();
						await pageHomeChannel.tabs.doAddPeopleToChannel(anyUser);
						await pageHomeChannel.tabs.btnTabMembers.click();
					}
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test.afterAll(async () => {
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
				test.beforeAll(async () => {
					if (!hasUserAddedInChannel) {
						await pageHomeChannel.tabs.btnTabMembers.click();
						await pageHomeChannel.tabs.doAddPeopleToChannel(anyUser);
						await pageHomeChannel.tabs.btnTabMembers.click();
					}
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test.afterAll(async () => {
					await pageHomeChannel.doDismissToast();
					await pageHomeChannel.tabs.btnTabMembers.click();
				});

				test('expect set "anyUser" as moderator', async () => {
					await pageHomeChannel.tabs.doSetUserModerator(anyUser);
					await expect(pageHomeChannel.content.lastMessageRoleAdded).toContainText(anyUser);
				});
			});

			test.describe('Channel name edit', async () => {
				test.beforeAll(async () => {
					await pageHomeChannel.doDismissToast();
					await pageHomeChannel.tabs.btnTabInfo.click();
				});

				test.afterAll(async () => {
					await pageHomeChannel.doDismissToast();

					if (await pageHomeChannel.tabs.mainSideBar.isVisible()) {
						await pageHomeChannel.tabs.btnTabInfo.click();
					}
				});

				test('expect edit channel name', async () => {
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
});
