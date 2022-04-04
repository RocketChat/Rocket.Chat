import { test, expect } from '@playwright/test';

import LoginPage from './utils/pageobjects/login.page';
import SideNav from './utils/pageobjects/side-nav.page';
import { adminLogin, ROCKET_CAT } from './utils/mocks/userAndPasswordMock';
import Administration from './utils/pageobjects/administration';
import FlexTab from './utils/pageobjects/flex-tab.page';
import { ROCKET_CAT_SELECTOR } from './utils/mocks/waitSelectorsMock';

test.describe.parallel('[Administration]', () => {
	let loginPage: LoginPage;
	let sideNav: SideNav;
	let admin: Administration;
	let flexTab: FlexTab;
	const checkBoxes = ['Direct', 'Public', 'Omnichannel', 'Discussions', 'Teams'];
	test.beforeAll(async ({ browser, baseURL }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		loginPage = new LoginPage(page);
		sideNav = new SideNav(page);
		flexTab = new FlexTab(page);
		admin = new Administration(page);
		await loginPage.goto(baseURL as string);
		await loginPage.login(adminLogin);
	});
	test.describe('[Admin View]', () => {
		test.beforeAll(async () => {
			await sideNav.sidebarUserMenu().click();
			await sideNav.admin().click();
		});

		test.describe('[Info]', () => {
			test('expect admin page is showed', async () => {
				await admin.infoLink().click();
				await expect(admin.infoDeployment()).toBeVisible();
				await expect(admin.infoLicense()).toBeVisible();
				await expect(admin.infoUsage()).toBeVisible();
				await expect(admin.infoFederation()).toBeVisible();
			});
		});

		test.describe('[Rooms]', () => {
			test.beforeAll(async () => {
				await admin.roomsLink().click();
			});

			test.afterAll(async () => {
				await admin.infoLink().click();
			});

			test.describe('[Render]', () => {
				test('expect rom page is rendered is rendered', async () => {
					await admin.verifyCheckBoxRendered(checkBoxes);
					await expect(admin.roomsSearchForm()).toBeVisible();
				});
			});

			test.describe('[Filter search input]', () => {
				test.beforeAll(async () => {
					await admin.roomsSearchForm().click();
				});

				test.afterAll(async () => {
					await admin.roomsSearchForm().click({ clickCount: 3 });
					await admin.keyboardPress('Backspace');
				});

				test('expect show the general channel', async () => {
					await admin.roomsSearchForm().type('general');
					await expect(admin.roomsGeneralChannel()).toBeVisible();
				});

				test('expect dont show rooms when room dont exist', async () => {
					await admin.roomsSearchForm().type('any_room');
					await expect(admin.notFoundChannelOrUser()).toBeVisible();
				});
			});
			test.describe('[Filter checkbox]', () => {
				console.log('aqui');
				let checkbox = 0;

				test.beforeAll(async () => {
					await admin.roomsSearchForm().click({ clickCount: 3 });
					await admin.keyboardPress('Backspace');
				});
				test.beforeEach(async () => {
					await admin.adminCheckBox(checkBoxes[checkbox]).click();
				});

				test.afterEach(async () => {
					console.log(checkbox);
					await admin.adminCheckBox(checkBoxes[checkbox]).click();
					checkbox++;
					console.log(checkbox);
				});

				test('expect not show the general channel with direct', async () => {
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
				});

				test('expect show the general channel with public ', async () => {
					await expect(admin.roomsGeneralChannel()).toBeVisible();
				});

				test('it should not show the general channel with private', async () => {
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
				});

				test('expect not show the general channel with omnichannel', async () => {
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
				});
				test('expect not show the general channel with discussion', async () => {
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
				});
				test('expect not show the general channel with teams', async () => {
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
				});
			});
			test.describe('[Users]', () => {
				test.beforeAll(async () => {
					await admin.usersLink().click();
				});

				test.afterAll(async () => {
					await admin.infoLink().click();
				});

				test.describe('filter text:', async () => {
					test.beforeEach(async () => {
						await admin.usersFilter().click();
					});

					test.afterAll(async () => {
						await admin.usersFilter().click();
						await admin.usersFilter().type('');
					});

					test('expect should show rocket.cat', async () => {
						await admin.usersFilter().type(ROCKET_CAT);
						await admin.waitForSelector(ROCKET_CAT_SELECTOR);
					});
					test('expect dont user when write wrong name', async () => {
						await admin.usersFilter().type('any_user_wrong');
						await expect(admin.notFoundChannelOrUser()).toBeVisible();
					});
				});

				test.describe('create user:', () => {
					test.beforeAll(async () => {
						await flexTab.usersAddUserTab().click();
					});

					test('expect tab user add is rendering', async () => {
						await expect(flexTab.usersAddUserName()).toBeVisible();
						await expect(flexTab.usersAddUserUsername()).toBeVisible();
						await expect(flexTab.usersAddUserEmail()).toBeVisible();
						await expect(flexTab.usersAddUserVerifiedCheckbox()).toBeVisible();
						await expect(flexTab.usersAddUserPassword()).toBeVisible();
						await expect(flexTab.usersAddUserRandomPassword()).toBeVisible();
						await expect(flexTab.usersAddUserChangePasswordCheckbox()).toBeVisible();
						await expect(flexTab.usersAddUserRoleList()).toBeVisible();
						await expect(flexTab.usersAddUserDefaultChannelCheckbox()).toBeVisible();
						await expect(flexTab.usersAddUserWelcomeEmailCheckbox()).toBeVisible();
						await expect(flexTab.usersButtonSave()).toBeVisible();
						await expect(flexTab.usersButtonCancel()).toBeVisible();

						await flexTab.usersAddUserTabClose().waitFor();
						await flexTab.usersAddUserTabClose().click();

						await expect(flexTab.addUserTable()).not.toBeVisible();
					});
				});
			});
		});

		// TODO verificar como é feito o invite
		// 	describe('[Flex Tab] ', () => {
		// 		describe('send invitation:', () => {
		// 			before(() => {
		// 				flexTab.usersSendInvitationTab.waitForVisible(5000);
		// 				flexTab.usersSendInvitationTab.click();
		// 				flexTab.usersSendInvitationTextArea.waitForVisible(5000);
		// 			});

		// 			after(() => {
		// 				flexTab.usersSendInvitationTab.waitForVisible(5000);
		// 				flexTab.usersSendInvitationTab.click();
		// 				flexTab.usersSendInvitationTextArea.waitForVisible(5000, true);
		// 			});

		// 			test('it should show the send invitation text area', () => {
		// 				flexTab.usersSendInvitationTextArea.should('be.visible');
		// 			});

		// 			it('it should show the cancel button', () => {
		// 				flexTab.usersButtonCancel.should('be.visible');
		// 			});

		// 			it('it should show the send button', () => {
		// 				flexTab.usersSendInvitationSend.should('be.visible');
		// 			});
		// 		});

		test.describe('[General Settings]', () => {
			test.beforeAll(async () => {
				await admin.settingsSearch().type('general');
				await admin.generalLink().click();
				await admin.settingsSearch().click({ clickCount: 3 });
				await admin.keyboardPress('Backspace');
			});

			test.describe('general:', () => {
				test('expect change site url reset button is showed', async () => {
					await admin.generalSiteUrl().type('something');
					await expect(admin.generalSiteUrlReset()).toBeVisible();
				});

				test('expect change site name reset button is showed', async () => {
					await admin.generalSiteName().type('something');
					await expect(admin.generalSiteNameReset()).toBeVisible();
				});

				test('expect show language field', async () => {
					await expect(admin.generalLanguage()).toBeVisible();
				});

				test('expect aloow invalid self-signed certs reset button is showed', async () => {
					await admin.generalSelfSignedCerts().click();
					await expect(admin.generalSelfSignedCertsReset()).toBeVisible();
					await admin.generalSelfSignedCerts().click();
					await expect(admin.generalSelfSignedCertsReset()).not.toBeVisible();
				});

				test('expect reset enable favorite room is showed', async () => {
					await admin.generalFavoriteRoom().click();
					await expect(admin.generalFavoriteRoomReset()).toBeVisible();
					await admin.generalFavoriteRoomReset().click();
					await expect(admin.generalFavoriteRoomReset()).not.toBeVisible();
				});

				test('expect CDN prefix reset not show after reset', async () => {
					await admin.generalCdnPrefix().type('something');
					await expect(admin.generalCdnPrefixReset()).toBeVisible();
					await admin.generalCdnPrefixReset().click();
					await expect(admin.generalCdnPrefixReset()).not.toBeVisible();
				});

				test('expect SSL reset not showing after reset', async () => {
					await admin.generalForceSSL().click();
					await expect(admin.generalForceSSLReset()).toBeVisible();
					await admin.generalForceSSLReset().click();
					await expect(admin.generalForceSSLReset()).not.toBeVisible();
				});

				test('expect google tag reset is not visible after reset', async () => {
					await admin.generalGoogleTagId().type('something');
					await expect(admin.generalGoogleTagIdReset()).toBeVisible();
					await admin.generalGoogleTagIdReset().click();
					await expect(admin.generalGoogleTagIdReset()).not.toBeVisible();
				});

				test('expect when change bugsnag API Key dont show reset button after reset', async () => {
					await admin.generalBugsnagKey().type('something');
					await expect(admin.generalBugsnagKeyReset()).toBeVisible();
					await admin.generalBugsnagKeyReset().click();
					await expect(admin.generalBugsnagKeyReset()).not.toBeVisible();
				});
				test('expect when change Robots dont show reset button after reset', async () => {
					await admin.robotsFileContents().type('aa');
					await expect(admin.robotsFileContentsReset()).toBeVisible();
					await admin.robotsFileContentsReset().click();
					await expect(admin.robotsFileContentsReset()).not.toBeVisible();
				});
				test('expect when change Default Referrer Policy dont show reset button after reset', async () => {
					await admin.defaultReferrerPolicy().click();
					await admin.defaultReferrerPolicyOptions().click();
					await expect(admin.defaultReferrerPolicyReset()).toBeVisible();
					await admin.defaultReferrerPolicyReset().click();
					await expect(admin.defaultReferrerPolicyReset()).not.toBeVisible();
				});
			});

			test.describe('iframe:', () => {
				test.beforeAll(async () => {
					await admin.generalSectionIframeIntegration().click();
				});

				test('expect iframe integration is rendering', async () => {
					await expect(admin.generalIframeSend()).toBeVisible();
					await expect(admin.generalIframeSendTargetOrigin()).toBeVisible();
					await expect(admin.generalIframeRecieve()).toBeVisible();
					await expect(admin.generalIframeRecieveOrigin()).toBeVisible();
				});
			});

			test.describe('notifications:', () => {
				test.beforeAll(async () => {
					await admin.generalSectionNotifications().click();
				});

				test('it should show the max room members field', async () => {
					await expect(admin.generalNotificationsMaxRoomMembers()).toBeVisible();
				});
			});

			test.describe('rest api:', async () => {
				test.beforeAll(async () => {
					await admin.generalSectionRestApi().click();
				});

				test('it should show the API user add limit field', async () => {
					await expect(admin.generalRestApiUserLimit()).toBeVisible();
				});
			});

			test.describe('reporting:', async () => {
				test.beforeAll(async () => {
					await admin.generalSectionReporting().click();
				});

				test('it should show the report to rocket.chat toggle', async () => {
					await expect(admin.generalReporting()).toBeVisible();
				});
			});

			test.describe('stream cast:', async () => {
				test.beforeAll(async () => {
					await admin.generalSectionStreamCast().click();
				});

				test('it should show the stream cast adress field', async () => {
					await expect(admin.generalStreamCastAdress()).toBeVisible();
				});
			});

			test.describe('utf8:', () => {
				test.beforeAll(() => {
					admin.generalSectionUTF8().click();
				});

				test('it should show the usernames utf8 regex field', async () => {
					await expect(admin.generalUTF8UsernamesRegex()).toBeVisible();
				});

				test('it should show the channels utf8 regex field', async () => {
					await expect(admin.generalUTF8ChannelsRegex()).toBeVisible();
				});

				test('it should show the utf8 names slug checkboxes', async () => {
					await expect(admin.generalUTF8NamesSlug()).toBeVisible();
				});
			});
		});

		test.describe('[Accounts]', () => {
			test.beforeAll(async () => {
				admin.settingsSearch().type('accounts');
				admin.accountsLink().click();
			});

			test.describe('default user preferences', () => {
				test.beforeAll(async () => {
					await admin.accountsSectionDefaultUserPreferences().click();
				});

				test('it should show the enable auto away field', async () => {
					await expect(admin.accountsEnableAutoAway()).toBeVisible();
				});

				test('the enable auto away field value should be true', async () => {
					await admin.accountsEnableAutoAway().check();
				});

				test('expect show the idle timeout limit field', async () => {
					await admin.accountsidleTimeLimit().click();
					await expect(admin.accountsidleTimeLimit()).toBeVisible();
					await expect(admin.accountsidleTimeLimit().inputValue()).toEqual('300');
				});

				test('expect show desktop audio notifications to be visible', async () => {
					await expect(admin.accountsDesktopNotifications()).toBeVisible();
					await expect(admin.accountsDesktopNotifications().locator('.rcx-select__item')).toHaveText('All messages');
				});

				test('expect show mobile notifications tobe visible and option have value', async () => {
					await expect(admin.accountsMobileNotifications()).toBeVisible();
					await expect(admin.accountsMobileNotifications().locator('.rcx-select__item')).toHaveText('All messages');
				});
				test('expect show mobile notifications tobe visible and option have value', async () => {
					await expect(admin.accountsMobileNotifications()).toBeVisible();
					await expect(admin.accountsMobileNotifications().locator('.rcx-select__item')).toHaveText('All messages');
				});

				test('expect show the unread tray icon and icon alert field is true', async () => {
					await expect(admin.accountsUnreadAlert()).toBeVisible();
					await expect(admin.accountsUnreadAlert().locator('input')).toBeChecked();
				});

				test('expect show the convert ascii and check is true', async () => {
					await expect(admin.accountsConvertAsciiEmoji().locator('input')).toBeVisible();
					await expect(admin.accountsConvertAsciiEmoji().locator('input')).toBeChecked();
				});

				test('expect show message is visible and check is true', async () => {
					await expect(admin.accountsAutoImageLoad()).toBeVisible();
					await expect(admin.accountsAutoImageLoad().locator('input')).toBeChecked();
				});

				test('expect show image is visible and check is true', async () => {
					await expect(admin.accountsAutoImageLoad()).toBeVisible();
					await expect(admin.accountsAutoImageLoad().locator('input')).toBeChecked();
				});

				test('expect account mobile bandwidth is showed ans check is true', async () => {
					await expect(admin.accountsSaveMobileBandwidth()).toBeVisible();
					await expect(admin.accountsSaveMobileBandwidth().locator('input')).toBeVisible();
				});

				test('expect show the collapse embedded media by default field and not be checked', async () => {
					await expect(admin.accountsCollapseMediaByDefault()).toBeVisible();
					await expect(admin.accountsCollapseMediaByDefault()).not.toBeChecked();
				});

				test('expect show the hide usernames field', async () => {
					await expect(admin.accountsHideUsernames()).toBeVisible();
					await expect(admin.accountsHideUsernames()).not.toBeChecked();
				});

				test('expect show admin hide roles and verify if checked', async () => {
					await expect(admin.accountsHideRoles()).toBeVisible();
					await expect(admin.accountsHideRoles()).not.toBeChecked();
				});

				test('expect ', async () => {
					await expect(admin.accountsHideFlexTab()).toBeVisible();
					await expect(admin.accountsHideFlexTab().locator('input')).not.toBeChecked();
				});

				test('expect', async () => {
					await expect(admin.accountsDisplayAvatars().locator('input')).toBeVisible();
					await expect(admin.accountsDisplayAvatars().locator('input')).toBeChecked();
				});

				it('it should show the enter key behavior field', () => {
					admin.accountsSendOnEnter.scrollIntoView();
					admin.accountsSendOnEnter.should('be.visible');
				});
			});
		});
	});
});
