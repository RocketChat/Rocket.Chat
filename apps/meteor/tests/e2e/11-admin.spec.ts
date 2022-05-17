import { test, expect } from '@playwright/test';

import LoginPage from './utils/pageobjects/LoginPage';
import SideNav from './utils/pageobjects/SideNav';
import { adminLogin, ROCKET_CAT } from './utils/mocks/userAndPasswordMock';
import Administration from './utils/pageobjects/Administration';
import FlexTab from './utils/pageobjects/FlexTab';
import { ROCKET_CAT_SELECTOR } from './utils/mocks/waitSelectorsMock';
import { Checkbox } from './utils/enums/Checkbox';

test.describe('[Administration]', () => {
	let loginPage: LoginPage;
	let sideNav: SideNav;
	let admin: Administration;
	let flexTab: FlexTab;
	const checkBoxesSelectors = ['Direct', 'Public', 'Private', 'Omnichannel', 'Discussions', 'Teams'];
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
					await admin.verifyCheckBoxRendered(checkBoxesSelectors);
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
				test.beforeAll(async () => {
					await admin.roomsSearchForm().click({ clickCount: 3 });
					await admin.keyboardPress('Backspace');
				});

				test('expect not show the general channel with direct', async () => {
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Direct]).click();
					await admin.roomsGeneralChannel().waitFor({ state: 'detached' });
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Direct]).click();
				});

				test('expect show the general channel with public ', async () => {
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Public]).click();
					await admin.roomsGeneralChannel().waitFor({ state: 'visible' });
					await expect(admin.roomsGeneralChannel()).toBeVisible();
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Public]).click();
				});

				test('expect not show the general channel with private ', async () => {
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Private]).click();
					await admin.roomsGeneralChannel().waitFor({ state: 'detached' });
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Private]).click();
				});

				test('expect not show the general channel with omnichannel', async () => {
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Omnichannel]).click();
					await admin.roomsGeneralChannel().waitFor({ state: 'detached' });
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Omnichannel]).click();
				});
				test('expect not show the general channel with discussion', async () => {
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Discussions]).click();
					await admin.roomsGeneralChannel().waitFor({ state: 'detached' });
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Discussions]).click();
				});
				test('expect not show the general channel with teams', async () => {
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Teams]).click();
					await admin.roomsGeneralChannel().waitFor({ state: 'detached' });
					await expect(admin.roomsGeneralChannel()).not.toBeVisible();
					await admin.adminCheckBox(checkBoxesSelectors[Checkbox.Teams]).click();
				});
			});
			test.describe('[Users]', () => {
				test.beforeAll(async () => {
					await admin.usersLink().click();
				});

				test.afterAll(async () => {
					await admin.infoLink().click();
				});

				test.describe('[Filter text]', async () => {
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

				test.describe('[Create user]', () => {
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

		// TODO verify how is make o invite
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
				await admin.settingsLink().click();
				await admin.settingsSearch().type('general');
				await admin.generalSettingsButton().click();
			});

			test.describe('[General]', () => {
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

			test.describe('[Iframe]', () => {
				test.beforeAll(async () => {
					await admin.generalSectionIframeIntegration().click();
				});

				test('expect iframe integration is rendering', async () => {
					await expect(admin.generalIframeSend()).toBeVisible();
					await expect(admin.generalIframeSendTargetOrigin()).toBeVisible();
					await expect(admin.generalIframeReceive()).toBeVisible();
					await expect(admin.generalIframeReceiveOrigin()).toBeVisible();
				});
			});

			test.describe('[Notifications]', () => {
				test.beforeAll(async () => {
					await admin.generalSectionNotifications().click();
				});

				test('expect the max room members field', async () => {
					await expect(admin.generalNotificationsMaxRoomMembers()).toBeVisible();
				});
			});

			test.describe('[Rest api]', async () => {
				test.beforeAll(async () => {
					await admin.generalSectionRestApi().click();
				});

				test('expect show the API user add limit field', async () => {
					await expect(admin.generalRestApiUserLimit()).toBeVisible();
				});
			});

			test.describe('[Reporting]', async () => {
				test.beforeAll(async () => {
					await admin.generalSectionReporting().click();
				});

				test('expect show the report to rocket.chat toggle', async () => {
					await expect(admin.generalReporting()).toBeVisible();
				});
			});

			test.describe('[Stream cast]', async () => {
				test.beforeAll(async () => {
					await admin.generalSectionStreamCast().click();
				});

				test('expect show the stream cast address field', async () => {
					await expect(admin.generalStreamCastAddress()).toBeVisible();
				});
			});

			test.describe('UTF-8', () => {
				test.beforeAll(async () => {
					await admin.generalSectionUTF8().click();
				});

				test('expect show the usernames utf8 regex field', async () => {
					await expect(admin.generalUTF8UsernamesRegex()).toBeVisible();
				});

				test('expect show the channels utf8 regex field', async () => {
					await expect(admin.generalUTF8ChannelsRegex()).toBeVisible();
				});

				test('expect show the utf8 names slug checkboxes', async () => {
					await expect(admin.generalUTF8NamesSlug()).toBeVisible();
				});
			});
		});

		test.describe('[Accounts]', () => {
			test.beforeAll(async () => {
				await admin.groupSettingsPageBack().click();
				await admin.settingsSearch().type('accounts');
				await admin.accountSettingsButton().click();
			});

			test.describe('[Default user preferences]', () => {
				test.beforeAll(async () => {
					await admin.accountsSectionDefaultUserPreferences().click();
				});

				test('expect show the enable auto away field', async () => {
					await expect(admin.accountsEnableAutoAway()).toBeVisible();
				});

				test('the enable auto away field value should be true', async () => {
					await admin.accountsEnableAutoAway().check();
				});

				test('expect show the idle timeout limit field', async () => {
					await expect(admin.accountsIdleTimeLimit()).toBeVisible();
					const inputValue = await admin.accountsIdleTimeLimit().inputValue();
					expect(inputValue).toEqual('300');
				});

				test('expect show desktop audio notifications to be visible', async () => {
					await expect(admin.accountsDesktopNotifications()).toBeVisible();
					await expect(admin.accountsDesktopNotifications().locator('.rcx-select__item')).toHaveText('All messages');
				});

				test('expect show mobile notifications to be visible and option have value', async () => {
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

				test('expect show the hide right sidebar with click field and not checked', async () => {
					await expect(admin.accountsHideFlexTab()).toBeVisible();
					await expect(admin.accountsHideFlexTab().locator('input')).not.toBeChecked();
				});

				test('expect show display avatars and is checked', async () => {
					await expect(admin.accountsDisplayAvatars().locator('input')).toBeVisible();
					await expect(admin.accountsDisplayAvatars().locator('input')).toBeChecked();
				});

				test('expect show the enter key behavior field', async () => {
					await expect(admin.accountsSendOnEnter()).toBeVisible();

					await expect(admin.accountsSendOnEnter().locator('.rcx-select__item')).toHaveText('Normal mode (send with Enter)');
				});

				test('the view mode field value should be ""', async () => {
					await expect(admin.accountsMessageViewMode()).toHaveText('');
				});

				test('expect show the offline email notification field and field value to be all', async () => {
					await expect(admin.accountsEmailNotificationMode()).toBeVisible();
				});

				test('expect the offline email notification field value should be all', async () => {
					await expect(admin.accountsEmailNotificationMode().locator('.rcx-select__item')).toHaveText('Every Mention/DM');
				});

				test('expect show the new room notification field', async () => {
					await expect(admin.accountsNewRoomNotification()).toBeVisible();
				});

				test('expect the new room notification field value should be door', async () => {
					await expect(admin.accountsNewRoomNotification().locator('.rcx-select__item')).toHaveText('Default');
				});

				test('expect show the new message notification field', async () => {
					await expect(admin.accountsNewMessageNotification()).toBeVisible();
				});

				test('expect the new message notification field value should be chime', async () => {
					await expect(admin.accountsNewMessageNotification().locator('.rcx-select__item')).toHaveText('Default');
				});

				test('expect show the notification sound volume field', async () => {
					await expect(admin.accountsNotificationsSoundVolume()).toBeVisible();
				});

				test('the notification sound volume field value should be 100', async () => {
					await expect(admin.accountsNotificationsSoundVolume()).toHaveValue('100');
				});
			});
		});
	});
});
