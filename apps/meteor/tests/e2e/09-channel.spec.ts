import { test, expect, Page } from '@playwright/test';

import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { publicChannelCreated, setPublicChannelCreated } from './utils/mocks/checks';
import { publicChannelName } from './utils/mocks/channel';
import { targetUser } from './utils/mocks/interations';
import { Login, FlexTab, MainContent, SideNav } from './page-objects';

let hasUserAddedInChannel = false;

test.describe('[Channel]', () => {
	let page: Page;
	let login: Login;
	let flexTab: FlexTab;
	let mainContent: MainContent;
	let sideNav: SideNav;

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();

		page = await context.newPage();
		login = new Login(page);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);
		flexTab = new FlexTab(page);

		await page.goto('/');
		await login.doLogin(adminLogin);

		if (!publicChannelCreated) {
			await sideNav.doCreateChannel(publicChannelName, false);
			setPublicChannelCreated(true);
		}

		await sideNav.doOpenChannel('general');
	});

	test.describe('[Search]', () => {
		test.describe('[SpotlightSearch]', async () => {
			test.describe('general:', () => {
				test('expect search general', async () => {
					await sideNav.spotlightSearchIcon.click();
					await sideNav.searchChannel('general');
				});

				test('expect go to general', async () => {
					await sideNav.doOpenChannel('general');
					await expect(mainContent.textTitleChannel('general')).toContainText('general');
				});
			});

			test.describe('user created channel:', () => {
				test('expect search the user created channel', async () => {
					await sideNav.spotlightSearchIcon.click();
					await sideNav.searchChannel(publicChannelName);
				});

				test('expect go to the user created channel', async () => {
					await sideNav.doOpenChannel(publicChannelName);
					await expect(mainContent.textTitleChannel(publicChannelName)).toContainText(publicChannelName);
				});
			});
		});

		test.describe('[SideNav Channel List]', () => {
			test.beforeAll(async () => {
				await mainContent.inputMessage.click();
			});

			test.describe('general:', async () => {
				test('expect show the general in the channel list', async () => {
					await sideNav.getChannelFromList('general').scrollIntoViewIfNeeded();
					await expect(sideNav.getChannelFromList('general')).toBeVisible();
				});

				test('expect go to the general channel', async () => {
					await sideNav.doOpenChannel('general');
				});
			});

			test.describe('user created channel:', async () => {
				test('expect show the user created channel in the channel list', async () => {
					await sideNav.getChannelFromList(publicChannelName).scrollIntoViewIfNeeded();
					await expect(sideNav.getChannelFromList(publicChannelName)).toBeVisible();
				});

				test('expect go to the user created channel', async () => {
					await sideNav.doOpenChannel(publicChannelName);
				});
			});
		});
	});

	test.describe('[Usage]', () => {
		test.beforeAll(async () => {
			await sideNav.doOpenChannel(publicChannelName);
		});

		test.describe('Adding a user to the room:', async () => {
			test.beforeAll(async () => {
				if (await flexTab.toastSuccess.isVisible()) {
					await flexTab.toastSuccess.click();
				}

				await flexTab.operateFlexTab('members', true);
			});

			test.afterAll(async () => {
				if (await flexTab.toastSuccess.isVisible()) {
					await flexTab.toastSuccess.click();
				}
				await flexTab.operateFlexTab('members', false);
			});

			test('expect add people to the room', async () => {
				await flexTab.addPeopleToChannel(targetUser);
				hasUserAddedInChannel = true;
				expect(await flexTab.toastSuccess.isVisible()).toBeTruthy();
			});
		});

		test.describe('[Channel settings]:', async () => {
			test.describe('[Channel topic edit]', async () => {
				test.beforeAll(async () => {
					await flexTab.operateFlexTab('info', true);
					await flexTab.btnEditName.click();
				});

				test.afterAll(async () => {
					if (await flexTab.toastSuccess.isVisible()) {
						await flexTab.toastSuccess.click();
					}

					if (await flexTab.mainSideBar.isVisible()) {
						await flexTab.btnSideBarClose.click();
					}
				});

				test('expect edit the topic input', async () => {
					await flexTab.inputEditTopicText.fill('TOPIC EDITED');
				});

				test('expect save the topic', async () => {
					await flexTab.btnEditNameSave.click();
				});

				test('expect show the new topic', async () => {
					await expect(flexTab.secondSetting('TOPIC EDITED')).toBeVisible();
				});
			});

			test.describe('[Channel announcement edit]', async () => {
				test.beforeAll(async () => {
					await flexTab.operateFlexTab('info', true);
					await flexTab.btnEditName.click();
				});

				test.afterAll(async () => {
					if (await flexTab.toastSuccess.isVisible()) {
						await flexTab.toastSuccess.click();
					}

					if (await flexTab.mainSideBar.isVisible()) {
						await flexTab.btnSideBarClose.click();
					}
				});

				test('expect edit the announcement input', async () => {
					await flexTab.inputEditAnnouncementText.type('ANNOUNCEMENT EDITED');
				});

				test('expect save the announcement', async () => {
					await flexTab.btnEditNameSave.click();
				});

				test('expect show the new announcement', async () => {
					await expect(flexTab.thirdSetting).toHaveText('ANNOUNCEMENT EDITED');
				});
			});

			test.describe('[Channel description edit]', async () => {
				test.beforeAll(async () => {
					await flexTab.operateFlexTab('info', true);
					await flexTab.btnEditName.click();
				});

				test.afterAll(async () => {
					if (await flexTab.toastSuccess.isVisible()) {
						await flexTab.toastSuccess.click();
					}

					if (await flexTab.mainSideBar.isVisible()) {
						await flexTab.btnSideBarClose.click();
					}
				});

				test('expect edit the description input', async () => {
					await flexTab.inputEditDescriptionText.type('DESCRIPTION EDITED');
				});

				test('expect save the description', async () => {
					await flexTab.btnEditNameSave.click();
				});

				test('expect show the new description', async () => {
					await flexTab.btnSideBarBack.click();
					await expect(flexTab.fourthSetting).toHaveText('DESCRIPTION EDITED');
				});
			});
		});

		test.describe('[Members tab usage]:', async () => {
			test.describe('User muted', async () => {
				test.beforeAll(async () => {
					if (!hasUserAddedInChannel) {
						await flexTab.operateFlexTab('members', true);
						await flexTab.addPeopleToChannel(targetUser);
						await flexTab.operateFlexTab('members', false);
					}
					await flexTab.operateFlexTab('members', true);
				});

				test.afterAll(async () => {
					if (await flexTab.toastSuccess.isVisible()) {
						await flexTab.toastSuccess.click();
					}

					await flexTab.operateFlexTab('members', false);
				});

				test('expect mute rocket cat', async () => {
					await flexTab.muteUser(targetUser);
				});
			});

			test.describe('[Owner added]', async () => {
				test.beforeAll(async () => {
					if (!hasUserAddedInChannel) {
						await flexTab.operateFlexTab('members', true);
						await flexTab.addPeopleToChannel(targetUser);
						await flexTab.operateFlexTab('members', false);
					}
					await flexTab.operateFlexTab('members', true);
				});

				test.afterAll(async () => {
					if (await flexTab.toastSuccess.isVisible()) {
						await flexTab.toastSuccess.click();
					}

					await flexTab.operateFlexTab('members', false);
				});

				test('expect set rocket cat as owner', async () => {
					await flexTab.setUserOwner(targetUser);
				});

				test('expect dismiss the toast', async () => {
					if (await flexTab.toastSuccess.isVisible()) {
						await flexTab.toastSuccess.click();
					}
				});

				test('expect the last message should be a subscription role added', async () => {
					await expect(mainContent.lastMessageRoleAdded).toBeVisible();
				});

				test('expect show the target username in owner add message', async () => {
					await expect(mainContent.lastMessageRoleAdded).toContainText(targetUser);
				});
			});

			test.describe('[Moderator added]', async () => {
				test.beforeAll(async () => {
					if (!hasUserAddedInChannel) {
						await flexTab.operateFlexTab('members', true);
						await flexTab.addPeopleToChannel(targetUser);
						await flexTab.operateFlexTab('members', false);
					}
					await flexTab.operateFlexTab('members', true);
				});

				test.afterAll(async () => {
					if (await flexTab.toastSuccess.isVisible()) {
						await flexTab.toastSuccess.click();
					}

					await flexTab.operateFlexTab('members', false);
				});

				test('expect set rocket cat as moderator', async () => {
					await flexTab.setUserModerator(targetUser);
				});

				test('expect be that the last message is a subscription role added', async () => {
					await expect(mainContent.lastMessageRoleAdded).toBeVisible();
				});
			});

			test.describe('Channel name edit', async () => {
				test.beforeAll(async () => {
					if (await flexTab.toastSuccess.isVisible()) {
						await flexTab.toastSuccess.click();
					}

					await flexTab.operateFlexTab('info', true);
				});

				test.afterAll(async () => {
					if (await flexTab.toastSuccess.isVisible()) {
						await flexTab.toastSuccess.click();
					}

					if (await flexTab.mainSideBar.isVisible()) {
						await flexTab.operateFlexTab('info', false);
					}
				});

				test('expect show the old name', async () => {
					await expect(flexTab.firstSetting).toHaveText(publicChannelName);
				});

				test('expect click the edit name', async () => {
					await flexTab.btnEditName.click();
				});

				test('expect edit the name input', async () => {
					await flexTab.inputEditNameText.fill(`NAME-EDITED-${publicChannelName}`);
				});

				test('expect save the name', async () => {
					await flexTab.btnEditNameSave.click();
				});

				test('expect show the new name', async () => {
					const channelName = sideNav.getChannelFromList(`NAME-EDITED-${publicChannelName}`);
					await expect(channelName).toHaveText(`NAME-EDITED-${publicChannelName}`);
				});
			});
		});
	});
});
