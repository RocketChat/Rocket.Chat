import { test, expect, Page } from '@playwright/test';

import { Auth, Administration } from './page-objects';

test.describe('Administration', () => {
	let page: Page;
	let pageAuth: Auth;
	let pageAdmin: Administration;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
		pageAdmin = new Administration(page);
	});

	test.beforeAll(async () => {
		await pageAuth.doLogin();
		await page.goto('/admin');
	});

	test.describe('Admin View', () => {
		test.describe('Info', () => {
			test('expect admin page is showed', async () => {
				await pageAdmin.infoLink.click();
				await expect(pageAdmin.infoDeployment).toBeVisible();
				await expect(pageAdmin.infoLicense).toBeVisible();
				await expect(pageAdmin.infoUsage).toBeVisible();
				await expect(pageAdmin.infoFederation).toBeVisible();
			});
		});

		test.describe('Rooms', () => {
			test.beforeAll(async () => {
				await pageAdmin.roomsLink.click();
			});

			test.afterAll(async () => {
				await pageAdmin.infoLink.click();
			});

			test.describe('Render', () => {
				test('expect rom page is rendered is rendered', async () => {
					await pageAdmin.verifyCheckBoxRendered(['Direct', 'Public', 'Private', 'Omnichannel', 'Discussions', 'Teams']);
					await expect(pageAdmin.roomsSearchForm).toBeVisible();
				});
			});

			test.describe('Filter search input', () => {
				test.beforeAll(async () => {
					await pageAdmin.roomsSearchForm.click();
				});

				test.afterAll(async () => {
					await pageAdmin.roomsSearchForm.click({ clickCount: 3 });
					await page.keyboard.press('Backspace');
				});

				test('expect show the general channel', async () => {
					await pageAdmin.roomsSearchForm.type('general');
					await expect(pageAdmin.roomsGeneralChannel).toBeVisible();
				});

				test('expect dont show rooms when room dont exist', async () => {
					await pageAdmin.roomsSearchForm.type('any_room');
					await expect(pageAdmin.notFoundChannelOrUser).toBeVisible();
				});
			});
			test.describe('Filter checkbox', () => {
				test.beforeAll(async () => {
					await pageAdmin.roomsSearchForm.click({ clickCount: 3 });
					await page.keyboard.press('Backspace');
				});

				test('expect not show the general channel with direct', async () => {
					await pageAdmin.adminCheckBox('Direct').click();
					await pageAdmin.roomsGeneralChannel.waitFor({ state: 'detached' });
					await expect(pageAdmin.roomsGeneralChannel).not.toBeVisible();
					await pageAdmin.adminCheckBox('Direct').click();
				});

				test('expect show the general channel with public ', async () => {
					await pageAdmin.adminCheckBox('Public').click();
					await pageAdmin.roomsGeneralChannel.waitFor({ state: 'visible' });
					await expect(pageAdmin.roomsGeneralChannel).toBeVisible();
					await pageAdmin.adminCheckBox('Public').click();
				});

				test('expect not show the general channel with private ', async () => {
					await pageAdmin.adminCheckBox('Private').click();
					await pageAdmin.roomsGeneralChannel.waitFor({ state: 'detached' });
					await expect(pageAdmin.roomsGeneralChannel).not.toBeVisible();
					await pageAdmin.adminCheckBox('Private').click();
				});

				test('expect not show the general channel with omnichannel', async () => {
					await pageAdmin.adminCheckBox('Omnichannel').click();
					await pageAdmin.roomsGeneralChannel.waitFor({ state: 'detached' });
					await expect(pageAdmin.roomsGeneralChannel).not.toBeVisible();
					await pageAdmin.adminCheckBox('Omnichannel').click();
				});
				test('expect not show the general channel with discussion', async () => {
					await pageAdmin.adminCheckBox('Discussions').click();
					await pageAdmin.roomsGeneralChannel.waitFor({ state: 'detached' });
					await expect(pageAdmin.roomsGeneralChannel).not.toBeVisible();
					await pageAdmin.adminCheckBox('Discussions').click();
				});
				test('expect not show the general channel with teams', async () => {
					await pageAdmin.adminCheckBox('Teams').click();
					await pageAdmin.roomsGeneralChannel.waitFor({ state: 'detached' });
					await expect(pageAdmin.roomsGeneralChannel).not.toBeVisible();
					await pageAdmin.adminCheckBox('Teams').click();
				});
			});
			test.describe('Users', () => {
				test.beforeAll(async () => {
					await pageAdmin.usersLink.click();
				});

				test.afterAll(async () => {
					await pageAdmin.infoLink.click();
				});

				test.describe('Filter text', async () => {
					test.beforeEach(async () => {
						await pageAdmin.usersFilter.click();
					});

					test.afterAll(async () => {
						await pageAdmin.usersFilter.click();
						await pageAdmin.usersFilter.type('');
					});

					test('expect should show rocket.cat', async () => {
						await pageAdmin.usersFilter.type('rocket.cat');
						await page.waitForSelector('//table//tbody//tr[1]//td//div//div//div//div[text()="Rocket.Cat"]');
					});

					test('expect dont user when write wrong name', async () => {
						await pageAdmin.usersFilter.type('any_user_wrong');
						await expect(pageAdmin.notFoundChannels).toBeVisible();
					});
				});

				test.describe('Create user', () => {
					test.beforeAll(async () => {
						await pageAdmin.tabs.usersAddUserTab.click();
					});

					test('expect tab user add is rendering', async () => {
						await expect(pageAdmin.tabs.usersAddUserName).toBeVisible();
						await expect(pageAdmin.tabs.usersAddUserUsername).toBeVisible();
						await expect(pageAdmin.tabs.usersAddUserEmail).toBeVisible();
						await expect(pageAdmin.tabs.usersAddUserVerifiedCheckbox).toBeVisible();
						await expect(pageAdmin.tabs.usersAddUserPassword).toBeVisible();
						await expect(pageAdmin.tabs.usersAddUserRoleList).toBeVisible();
						await expect(pageAdmin.tabs.usersAddUserRandomPassword).toBeVisible();
						await expect(pageAdmin.tabs.usersAddUserChangePasswordCheckbox).toBeVisible();
						await expect(pageAdmin.tabs.usersAddUserDefaultChannelCheckbox).toBeVisible();
						await expect(pageAdmin.tabs.usersAddUserWelcomeEmailCheckbox).toBeVisible();
						await expect(pageAdmin.tabs.usersButtonCancel).toBeVisible();
						await expect(pageAdmin.tabs.usersButtonSave).toBeVisible();

						await pageAdmin.tabs.usersAddUserTabClose.click();

						await expect(pageAdmin.tabs.addUserTable).not.toBeVisible();
					});
				});
			});
		});

		test.describe('General Settings', () => {
			test.beforeAll(async () => {
				await pageAdmin.settingsLink.click();
				await pageAdmin.settingsSearch.type('general');
				await pageAdmin.generalSettingsButton.click();
			});

			test.describe('General', () => {
				test('expect change site url reset button is showed', async () => {
					await pageAdmin.generalSiteUrl.type('something');
					await expect(pageAdmin.generalSiteUrlReset).toBeVisible();
					await pageAdmin.generalSiteUrlReset.click();
				});

				test('expect change site name reset button is showed', async () => {
					await pageAdmin.generalSiteName.type('something');
					await expect(pageAdmin.generalSiteNameReset).toBeVisible();
				});

				test('expect show language field', async () => {
					await expect(pageAdmin.generalLanguage).toBeVisible();
				});

				test('expect aloow invalid self-signed certs reset button is showed', async () => {
					await pageAdmin.generalSelfSignedCerts.click();
					await expect(pageAdmin.generalSelfSignedCertsReset).toBeVisible();
					await pageAdmin.generalSelfSignedCerts.click();
					await expect(pageAdmin.generalSelfSignedCertsReset).not.toBeVisible();
				});

				test('expect reset enable favorite room is showed', async () => {
					await pageAdmin.generalFavoriteRoom.click();
					await expect(pageAdmin.generalFavoriteRoomReset).toBeVisible();
					await pageAdmin.generalFavoriteRoomReset.click();
					await expect(pageAdmin.generalFavoriteRoomReset).not.toBeVisible();
				});

				test('expect CDN prefix reset not show after reset', async () => {
					await pageAdmin.generalCdnPrefix.type('something');
					await expect(pageAdmin.generalCdnPrefixReset).toBeVisible();
					await pageAdmin.generalCdnPrefixReset.click();
					await expect(pageAdmin.generalCdnPrefixReset).not.toBeVisible();
				});

				test('expect SSL reset not showing after reset', async () => {
					await pageAdmin.generalForceSSL.click();
					await expect(pageAdmin.generalForceSSLReset).toBeVisible();
					await pageAdmin.generalForceSSLReset.click();
					await expect(pageAdmin.generalForceSSLReset).not.toBeVisible();
				});

				test('expect google tag reset is not visible after reset', async () => {
					await pageAdmin.generalGoogleTagId.type('something');
					await expect(pageAdmin.generalGoogleTagIdReset).toBeVisible();
					await pageAdmin.generalGoogleTagIdReset.click();
					await expect(pageAdmin.generalGoogleTagIdReset).not.toBeVisible();
				});

				test('expect when change bugsnag API Key dont show reset button after reset', async () => {
					await pageAdmin.generalBugsnagKey.type('something');
					await expect(pageAdmin.generalBugsnagKeyReset).toBeVisible();
					await pageAdmin.generalBugsnagKeyReset.click();
					await expect(pageAdmin.generalBugsnagKeyReset).not.toBeVisible();
				});
				test('expect when change Robots dont show reset button after reset', async () => {
					await pageAdmin.robotsFileContents.type('aa');
					await expect(pageAdmin.robotsFileContentsReset).toBeVisible();
					await pageAdmin.robotsFileContentsReset.click();
					await expect(pageAdmin.robotsFileContentsReset).not.toBeVisible();
				});
				test('expect when change Default Referrer Policy dont show reset button after reset', async () => {
					await pageAdmin.defaultReferrerPolicy.click();
					await pageAdmin.defaultReferrerPolicyOptions.click();
					await expect(pageAdmin.defaultReferrerPolicyReset).toBeVisible();
					await pageAdmin.defaultReferrerPolicyReset.click();
					await expect(pageAdmin.defaultReferrerPolicyReset).not.toBeVisible();
				});
			});

			test.describe('Iframe', () => {
				test.beforeAll(async () => {
					await pageAdmin.generalSectionIframeIntegration.click();
				});

				test('expect iframe integration is rendering', async () => {
					await expect(pageAdmin.generalIframeSend).toBeVisible();
					await expect(pageAdmin.generalIframeSendTargetOrigin).toBeVisible();
					await expect(pageAdmin.generalIframeReceive).toBeVisible();
					await expect(pageAdmin.generalIframeReceiveOrigin).toBeVisible();
				});
			});

			test.describe('Notifications', () => {
				test.beforeAll(async () => {
					await pageAdmin.generalSectionNotifications.click();
				});

				test('expect the max room members field', async () => {
					await expect(pageAdmin.generalNotificationsMaxRoomMembers).toBeVisible();
				});
			});

			test.describe('Rest api', async () => {
				test.beforeAll(async () => {
					await pageAdmin.generalSectionRestApi.click();
				});

				test('expect show the API user add limit field', async () => {
					await expect(pageAdmin.generalRestApiUserLimit).toBeVisible();
				});
			});

			test.describe('Reporting', async () => {
				test.beforeAll(async () => {
					await pageAdmin.generalSectionReporting.click();
				});

				test('expect show the report to rocket.chat toggle', async () => {
					await expect(pageAdmin.generalReporting).toBeVisible();
				});
			});

			test.describe('Stream cast', async () => {
				test.beforeAll(async () => {
					await pageAdmin.generalSectionStreamCast.click();
				});

				test('expect show the stream cast address field', async () => {
					await expect(pageAdmin.generalStreamCastAddress).toBeVisible();
				});
			});

			test.describe('UTF-8', () => {
				test.beforeAll(async () => {
					await pageAdmin.generalSectionUTF8.click();
				});

				test('expect show the usernames utf8 regex field', async () => {
					await expect(pageAdmin.generalUTF8UsernamesRegex).toBeVisible();
				});

				test('expect show the channels utf8 regex field', async () => {
					await expect(pageAdmin.generalUTF8ChannelsRegex).toBeVisible();
				});

				test('expect show the utf8 names slug checkboxes', async () => {
					await expect(pageAdmin.generalUTF8NamesSlug).toBeVisible();
				});
			});
		});

		test.describe('Accounts', () => {
			test.beforeAll(async () => {
				await pageAdmin.groupSettingsPageBack.click();
				await pageAdmin.settingsSearch.type('accounts');
				await pageAdmin.accountSettingsButton.click();
			});

			test.describe('Default user preferences', () => {
				test.beforeAll(async () => {
					await pageAdmin.accountsSectionDefaultUserPreferences.click();
				});

				test('expect show the enable auto away field', async () => {
					await expect(pageAdmin.accountsEnableAutoAway).toBeVisible();
				});

				test('the enable auto away field value should be true', async () => {
					await pageAdmin.accountsEnableAutoAway.check();
				});

				test('expect show the idle timeout limit field', async () => {
					await expect(pageAdmin.accountsIdleTimeLimit).toBeVisible();
					const inputValue = await pageAdmin.accountsIdleTimeLimit.inputValue();
					expect(inputValue).toEqual('300');
				});

				test('expect show desktop audio notifications to be visible', async () => {
					await expect(pageAdmin.accountsDesktopNotifications).toBeVisible();
					await expect(pageAdmin.accountsDesktopNotifications.locator('.rcx-select__item')).toHaveText('All messages');
				});

				test('expect show mobile notifications to be visible and option have value', async () => {
					await expect(pageAdmin.accountsMobileNotifications).toBeVisible();
					await expect(pageAdmin.accountsMobileNotifications.locator('.rcx-select__item')).toHaveText('All messages');
				});

				test('expect show the unread tray icon and icon alert field is true', async () => {
					await expect(pageAdmin.accountsUnreadAlert).toBeVisible();
					await expect(pageAdmin.accountsUnreadAlert.locator('input')).toBeChecked();
				});

				test('expect show the convert ascii and check is true', async () => {
					await expect(pageAdmin.accountsConvertAsciiEmoji.locator('input')).toBeVisible();
					await expect(pageAdmin.accountsConvertAsciiEmoji.locator('input')).toBeChecked();
				});

				test('expect show message is visible and check is true', async () => {
					await expect(pageAdmin.accountsAutoImageLoad).toBeVisible();
					await expect(pageAdmin.accountsAutoImageLoad.locator('input')).toBeChecked();
				});

				test('expect show image is visible and check is true', async () => {
					await expect(pageAdmin.accountsAutoImageLoad).toBeVisible();
					await expect(pageAdmin.accountsAutoImageLoad.locator('input')).toBeChecked();
				});

				test('expect account mobile bandwidth is showed ans check is true', async () => {
					await expect(pageAdmin.accountsSaveMobileBandwidth).toBeVisible();
					await expect(pageAdmin.accountsSaveMobileBandwidth.locator('input')).toBeVisible();
				});

				test('expect show the collapse embedded media by default field and not be checked', async () => {
					await expect(pageAdmin.accountsCollapseMediaByDefault).toBeVisible();
					await expect(pageAdmin.accountsCollapseMediaByDefault).not.toBeChecked();
				});

				test('expect show the hide usernames field', async () => {
					await expect(pageAdmin.accountsHideUsernames).toBeVisible();
					await expect(pageAdmin.accountsHideUsernames).not.toBeChecked();
				});

				test('expect show admin hide roles and verify if checked', async () => {
					await expect(pageAdmin.accountsHideRoles).toBeVisible();
					await expect(pageAdmin.accountsHideRoles).not.toBeChecked();
				});

				test('expect show the hide right sidebar with click field and not checked', async () => {
					await expect(pageAdmin.accountsHideFlexTab).toBeVisible();
					await expect(pageAdmin.accountsHideFlexTab.locator('input')).not.toBeChecked();
				});

				test('expect show display avatars and is checked', async () => {
					await expect(pageAdmin.accountsDisplayAvatars.locator('input')).toBeVisible();
					await expect(pageAdmin.accountsDisplayAvatars.locator('input')).toBeChecked();
				});

				test('expect show the enter key behavior field', async () => {
					await expect(pageAdmin.accountsSendOnEnter).toBeVisible();

					await expect(pageAdmin.accountsSendOnEnter.locator('.rcx-select__item')).toHaveText('Normal mode (send with Enter)');
				});

				test('the view mode field value should be ""', async () => {
					await expect(pageAdmin.accountsMessageViewMode).toHaveText('');
				});

				test('expect show the offline email notification field and field value to be all', async () => {
					await expect(pageAdmin.accountsEmailNotificationMode).toBeVisible();
				});

				test('expect the offline email notification field value should be all', async () => {
					await expect(pageAdmin.accountsEmailNotificationMode.locator('.rcx-select__item')).toHaveText('Every Mention/DM');
				});

				test('expect show the new room notification field', async () => {
					await expect(pageAdmin.accountsNewRoomNotification).toBeVisible();
				});

				test('expect the new room notification field value should be door', async () => {
					await expect(pageAdmin.accountsNewRoomNotification.locator('.rcx-select__item')).toHaveText('Default');
				});

				test('expect show the new message notification field', async () => {
					await expect(pageAdmin.accountsNewMessageNotification).toBeVisible();
				});

				test('expect the new message notification field value should be chime', async () => {
					await expect(pageAdmin.accountsNewMessageNotification.locator('.rcx-select__item')).toHaveText('Default');
				});

				test('expect show the notification sound volume field', async () => {
					await expect(pageAdmin.accountsNotificationsSoundVolume).toBeVisible();
				});

				test('the notification sound volume field value should be 100', async () => {
					await expect(pageAdmin.accountsNotificationsSoundVolume).toHaveValue('100');
				});
			});
		});
	});
});
