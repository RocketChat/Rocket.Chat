import { test, expect } from '@playwright/test';

import FlexTab from './utils/pageobjects/FlexTab';
import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';
import LoginPage from './utils/pageobjects/LoginPage';
import Global from './utils/pageobjects/Global';
import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { LOCALHOST } from './utils/mocks/urlMock';
import { publicChannelCreated, setPublicChannelCreated } from './utils/mocks/checks';
import { publicChannelName } from './utils/mocks/channel';
import { targetUser } from './utils/mocks/interations';

let hasUserAddedInChannel = false;

test.describe('[Channel]', () => {
	let flexTab: FlexTab;
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let global: Global;

	test.beforeAll(async ({ browser, baseURL }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		const URL = baseURL || LOCALHOST;
		loginPage = new LoginPage(page);
		await loginPage.goto(URL);

		await loginPage.login(adminLogin);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);
		flexTab = new FlexTab(page);
		global = new Global(page);

		if (!publicChannelCreated) {
			await sideNav.createChannel(publicChannelName, false);
			await setPublicChannelCreated(true);
		}
		await sideNav.openChannel('general');
	});
	test.describe('[Search]', () => {
		test.describe('[SpotlightSearch]', async () => {
			test.describe('general:', () => {
				test('expect search general', async () => {
					await sideNav.spotlightSearchIcon().click();
					await sideNav.searchChannel('general');
				});

				test('expect go to general', async () => {
					await sideNav.openChannel('general');
					await expect(mainContent.channelTitle('general')).toContainText('general');
				});
			});

			test.describe('user created channel:', () => {
				test('expect search the user created channel', async () => {
					await sideNav.spotlightSearchIcon().click();
					await sideNav.searchChannel(publicChannelName);
				});

				test('expect go to the user created channel', async () => {
					await sideNav.openChannel(publicChannelName);
					await expect(mainContent.channelTitle(publicChannelName)).toContainText(publicChannelName);
				});
			});
		});

		test.describe('[SideNav Channel List]', () => {
			test.beforeAll(async () => {
				await mainContent.messageInput().click();
			});

			test.describe('general:', async () => {
				test('expect show the general in the channel list', async () => {
					await sideNav.getChannelFromList('general').scrollIntoViewIfNeeded();
					await expect(sideNav.getChannelFromList('general')).toBeVisible();
				});

				test('expect go to the general channel', async () => {
					await sideNav.openChannel('general');
				});
			});

			test.describe('user created channel:', async () => {
				test('expect show the user created channel in the channel list', async () => {
					await sideNav.getChannelFromList(publicChannelName).scrollIntoViewIfNeeded();
					await expect(sideNav.getChannelFromList(publicChannelName)).toBeVisible();
				});

				test('expect go to the user created channel', async () => {
					await sideNav.openChannel(publicChannelName);
				});
			});
		});
	});

	test.describe('[Usage]', () => {
		test.beforeAll(async () => {
			await sideNav.openChannel(publicChannelName);
		});

		test.describe('Adding a user to the room:', async () => {
			test.beforeAll(async () => {
				if (await global.toastAlert().isVisible()) {
					await global.dismissToast();
				}
				await flexTab.operateFlexTab('members', true);
			});

			test.afterAll(async () => {
				if (await global.toastAlert().isVisible()) {
					await global.dismissToast();
				}
				await flexTab.operateFlexTab('members', false);
			});

			test('expect add people to the room', async () => {
				await flexTab.addPeopleToChannel(targetUser);
				hasUserAddedInChannel = true;
				await expect(global.toastAlert()).toBeVisible();
			});
		});

		test.describe('[Channel settings]:', async () => {
			test.describe('[Channel topic edit]', async () => {
				test.beforeAll(async () => {
					await flexTab.operateFlexTab('info', true);
					await flexTab.editNameBtn().click();
				});

				test.afterAll(async () => {
					if (await global.toastAlert().isVisible()) {
						await global.dismissToast();
					}
					if (await flexTab.mainSideBar().isVisible()) {
						await flexTab.mainSideBarClose().click();
					}
				});

				test('expect edit the topic input', async () => {
					await flexTab.editTopicTextInput().fill('TOPIC EDITED');
				});

				test('expect save the topic', async () => {
					await flexTab.editNameSave().click();
				});

				test('expect show the new topic', async () => {
					await expect(flexTab.secondSetting('TOPIC EDITED')).toBeVisible();
				});
			});

			test.describe('[Channel announcement edit]', async () => {
				test.beforeAll(async () => {
					await flexTab.operateFlexTab('info', true);
					await flexTab.editNameBtn().click();
				});

				test.afterAll(async () => {
					if (await global.toastAlert().isVisible()) {
						await global.dismissToast();
					}
					if (await flexTab.mainSideBar().isVisible()) {
						await flexTab.mainSideBarClose().click();
					}
				});

				test('expect edit the announcement input', async () => {
					await flexTab.editAnnouncementTextInput().type('ANNOUNCEMENT EDITED');
				});

				test('expect save the announcement', async () => {
					await flexTab.editNameSave().click();
				});

				test('expect show the new announcement', async () => {
					await expect(flexTab.thirdSetting()).toHaveText('ANNOUNCEMENT EDITED');
				});
			});

			test.describe('[Channel description edit]', async () => {
				test.beforeAll(async () => {
					await flexTab.operateFlexTab('info', true);
					await flexTab.editNameBtn().click();
				});

				test.afterAll(async () => {
					if (await global.toastAlert().isVisible()) {
						await global.dismissToast();
					}
					if (await flexTab.mainSideBar().isVisible()) {
						await flexTab.mainSideBarClose().click();
					}
				});

				test('expect edit the description input', async () => {
					await flexTab.editDescriptionTextInput().type('DESCRIPTION EDITED');
				});

				test('expect save the description', async () => {
					await flexTab.editNameSave().click();
				});

				test('expect show the new description', async () => {
					await flexTab.mainSideBarBack().click();
					await expect(flexTab.fourthSetting()).toHaveText('DESCRIPTION EDITED');
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
					if (await global.toastAlert().isVisible()) {
						await global.dismissToast();
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
					if (await global.toastAlert().isVisible()) {
						await global.dismissToast();
					}
					await flexTab.operateFlexTab('members', false);
				});

				test('expect set rocket cat as owner', async () => {
					await flexTab.setUserOwner(targetUser);
				});

				test('expect dismiss the toast', async () => {
					if (await global.toastAlert().isVisible()) {
						await global.dismissToast();
					}
				});

				test('expect the last message should be a subscription role added', async () => {
					await expect(mainContent.lastMessageRoleAdded()).toBeVisible();
				});

				test('expect show the target username in owner add message', async () => {
					await expect(mainContent.lastMessageRoleAdded()).toContainText(targetUser);
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
					if (await global.toastAlert().isVisible()) {
						await global.dismissToast();
					}
					await flexTab.operateFlexTab('members', false);
				});

				test('expect set rocket cat as moderator', async () => {
					await flexTab.setUserModerator(targetUser);
				});

				test('expect be that the last message is a subscription role added', async () => {
					await expect(mainContent.lastMessageRoleAdded()).toBeVisible();
				});
			});

			test.describe('Channel name edit', async () => {
				test.beforeAll(async () => {
					if (await global.toastAlert().isVisible()) {
						await global.dismissToast();
					}
					await flexTab.operateFlexTab('info', true);
				});

				test.afterAll(async () => {
					if (await global.toastAlert().isVisible()) {
						await global.dismissToast();
					}

					if (await flexTab.mainSideBar().isVisible()) {
						await flexTab.operateFlexTab('info', false);
					}
				});

				test('expect show the old name', async () => {
					await expect(flexTab.firstSetting()).toHaveText(publicChannelName);
				});

				test('expect click the edit name', async () => {
					await flexTab.editNameBtn().click();
				});

				test('expect edit the name input', async () => {
					await flexTab.editNameTextInput().fill(`NAME-EDITED-${publicChannelName}`);
				});

				test('expect save the name', async () => {
					await flexTab.editNameSave().click();
				});

				test('expect show the new name', async () => {
					const channelName = sideNav.getChannelFromList(`NAME-EDITED-${publicChannelName}`);
					await expect(channelName).toHaveText(`NAME-EDITED-${publicChannelName}`);
				});
			});
		});
	});
});
