/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import sideNav from '../../pageobjects/side-nav.page';
import flexTab from '../../pageobjects/flex-tab.page';
import admin from '../../pageobjects/administration.page';

//test data imports
import {checkIfUserIsAdmin} from '../../data/checks';
import {adminUsername, adminEmail, adminPassword} from '../../data/user.js';

describe('[Administration]', () => {
	before(() => {
		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.general.waitForVisible(5000);
		sideNav.general.click();
	});

	after(() => {
		sideNav.preferencesClose.waitForVisible(5000);
		sideNav.preferencesClose.click();
	});

	describe('[Admin View]', () => {
		before(() => {
			sideNav.accountMenu.click();
			sideNav.admin.waitForVisible(5000);
		});

		it('it should enter the admin view', () => {
			sideNav.admin.click();
			admin.flexNavContent.waitForVisible(5000);
		});

		describe('info:', () => {
			before(() =>{
				admin.infoLink.waitForVisible(5000);
				admin.infoLink.click();
				admin.infoRocketChatTable.waitForVisible(5000);
			});
			it('the first title should be Rocket.Chat', () => {
				admin.infoRocketChatTableTitle.getText().should.equal('Rocket.Chat');
			});

			it('it should show the rocket chat table', () => {
				admin.infoRocketChatTable.isVisible().should.be.true;
			});

			it('the second title should be Commit', () => {
				admin.infoCommitTableTitle.getText().should.equal('Commit');
			});

			it('it should show the Commit table', () => {
				admin.infoCommitTable.isVisible().should.be.true;
			});

			it('the first title should be Runtime_Environment', () => {
				admin.infoRuntimeTableTitle.moveToObject();
				admin.infoRuntimeTableTitle.getText().should.equal('Runtime_Environment');
			});

			it('it should show the Runtime_Environment table', () => {
				admin.infoRuntimeTable.isVisible().should.be.true;
			});

			it('the first title should be Build_Environment', () => {
				admin.infoBuildTableTitle.moveToObject();
				admin.infoBuildTableTitle.getText().should.equal('Build_Environment');
			});

			it('it should show the Build_Environment table', () => {
				admin.infoBuildTable.isVisible().should.be.true;
			});
		});

		describe.skip('[Rooms]', () => {
			before(() => {
				admin.roomsLink.waitForVisible(5000);
				admin.roomsLink.click();
				admin.roomsFilter.waitForVisible(5000);
			});

			after(() => {
				admin.infoLink.click();
			});

			describe('render:', () => {
				it('it should show the search form', () => {
					admin.roomsSearchForm.isVisible().should.be.true;
				});

				it('it should show the rooms Filter', () => {
					admin.roomsFilter.isVisible().should.be.true;
				});

				it('it should show the channel checkbox', () => {
					admin.roomsChannelsCheckbox.isVisible().should.be.true;
				});

				it('it should show the direct messsage checkbox', () => {
					admin.roomsDirectCheckbox.isVisible().should.be.true;
				});

				it('it should show the Private channel checkbox', () => {
					admin.roomsPrivateCheckbox.isVisible().should.be.true;
				});

				it('it should show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.true;
				});
			});

			describe('filter text:', () => {
				before(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.setValue('general');
				});

				after(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.setValue('');
				});

				it('it should show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.true;
				});
			});

			describe('filter text with wrong channel:', () => {
				before(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.setValue('something else');
				});

				after(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.setValue('');
				});

				it('it should not show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.false;
				});
			});

			describe('filter checkbox:', () => {
				let checkbox = 1;
				before(() => {
					admin.roomsFilter.setValue('');
					//add value triggers a key event that changes search±±±±±±±±±
					admin.roomsFilter.addValue(' ');
					admin.roomsGeneralChannel.waitForVisible(5000);
				});
				beforeEach(() => {
					switch (checkbox) {
						case 1:
							admin.roomsChannelsCheckbox.click();
							break;
						case 2:
							admin.roomsDirectCheckbox.click();
							break;
						case 3:
							admin.roomsPrivateCheckbox.click();
							break;
					}
				});

				afterEach(() => {
					switch (checkbox) {
						case 1:
							admin.roomsChannelsCheckbox.click();
							checkbox ++;
							break;
						case 2:
							admin.roomsDirectCheckbox.click();
							checkbox ++;
							break;
						case 3:
							admin.roomsPrivateCheckbox.click();
							break;
					}
				});

				it('it should show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.true;
				});

				it('it should not show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.false;
				});

				it('it should not show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.false;
				});
			});
		});

		describe.skip('[Users]', () => {
			before(() => {
				admin.usersLink.waitForVisible(5000);
				admin.usersLink.click();
				admin.usersFilter.waitForVisible(5000);
			});

			after(() => {
				admin.infoLink.click();
			});

			it('it should show the search form', () => {
				admin.usersFilter.isVisible().should.be.true;
			});


			it('it should show rocket.cat', () => {
			//it cant find the user if there is too many users
				admin.usersRocketCat.isVisible().should.be.true;
			});

			describe('filter text:', () => {
				before(() => {
					admin.usersFilter.click();
					admin.usersFilter.setValue('Rocket.Cat');
				});

				after(() => {
					admin.usersFilter.click();
					admin.usersFilter.setValue('');
				});

				it('it should show rocket.cat', () => {
					admin.usersRocketCat.waitForVisible();
					admin.usersRocketCat.isVisible().should.be.true;
				});
			});

			describe('filter text with wrong user:', () => {
				before(() => {
					admin.usersFilter.click();
					admin.usersFilter.setValue('something else');
				});

				after(() => {
					admin.usersFilter.click();
					admin.usersFilter.setValue('');
				});

				it('it should not show rocket.cat', () => {
					admin.usersRocketCat.isVisible().should.be.false;
				});
			});

			describe('[Flex Tab] ', () => {
				describe('send invitation:', () => {
					before(() => {
						flexTab.usersSendInvitationTab.waitForVisible(5000);
						flexTab.usersSendInvitationTab.click();
						flexTab.usersSendInvitationTextArea.waitForVisible(5000);
					});

					after(() => {
						flexTab.usersSendInvitationTab.waitForVisible(5000);
						flexTab.usersSendInvitationTab.click();
						flexTab.usersSendInvitationTextArea.waitForVisible(5000, true);
					});

					it('it should show the send invitation text area', () => {
						flexTab.usersSendInvitationTextArea.isVisible().should.be.true;
					});

					it('it should show the cancel button', () => {
						flexTab.usersButtonCancel.isVisible().should.be.true;
					});

					it('it should show the send button', () => {
						flexTab.usersSendInvitationSend.isVisible().should.be.true;
					});
				});

				describe('create user:', () => {
					before(() => {
						flexTab.usersAddUserTab.waitForVisible(5000);
						flexTab.usersAddUserTab.click();
						flexTab.usersAddUserName.waitForVisible(5000);
					});

					after(() => {
						flexTab.usersAddUserTab.waitForVisible(5000);
						flexTab.usersAddUserTab.click();
						flexTab.usersAddUserName.waitForVisible(5000, true);
					});

					it('it should show the name field', () => {
						flexTab.usersAddUserName.isVisible().should.be.true;
					});

					it('it should show the username field', () => {
						flexTab.usersAddUserUsername.isVisible().should.be.true;
					});

					it('it should show the email field', () => {
						flexTab.usersAddUserEmail.isVisible().should.be.true;
					});

					it('it should show the verified checkbox', () => {
						flexTab.usersAddUserVerifiedCheckbox.isVisible().should.be.true;
					});

					it('it should show the password field', () => {
						flexTab.usersAddUserPassword.isVisible().should.be.true;
					});

					it('it should show the random password button', () => {
						flexTab.usersAddUserRandomPassword.isVisible().should.be.true;
					});

					it('it should show the require password change button', () => {
						flexTab.usersAddUserChangePasswordCheckbox.isVisible().should.be.true;
					});

					it('it should show the role dropdown', () => {
						flexTab.usersAddUserRoleList.waitForVisible(5000);
						flexTab.usersAddUserRoleList.isVisible().should.be.true;
					});

					it('ít should show the add role button', () => {
						flexTab.usersAddUserRoleButton.waitForVisible(5000);
						flexTab.usersAddUserRoleButton.isVisible().should.be.true;
					});

					it('it should show the join default channel checkbox', () => {
						flexTab.usersAddUserDefaultChannelCheckbox.isVisible().should.be.true;
					});

					it('it should show the send welcome checkbox', () => {
						flexTab.usersAddUserWelcomeEmailCheckbox.isVisible().should.be.true;
					});

					it('it should show the save button', () => {
						flexTab.usersButtonSave.isVisible().should.be.true;
					});

					it('it should show the cancel button', () => {
						flexTab.usersButtonCancel.isVisible().should.be.true;
					});
				});
			});
		});

		describe('[Roles]', () => {
			before(() =>{
				admin.permissionsLink.waitForVisible(5000);
				admin.permissionsLink.click();
				admin.rolesPermissionGrid.waitForVisible(5000);
			});

			after(() => {
				admin.infoLink.click();
			});

			it('it should show the permissions grid', () => {
				admin.rolesPermissionGrid.isVisible().should.be.true;
			});

			it('it should show the new role button', () => {
				admin.rolesNewRolesButton.isVisible().should.be.true;
			});

			it('it should show the admin link', () => {
				admin.rolesAdmin.isVisible().should.be.true;
			});

			describe('new role:', () => {
				before(() => {
					admin.rolesNewRolesButton.waitForVisible(5000);
					admin.rolesNewRolesButton.click();
					admin.rolesReturnLink.waitForVisible(5000);
				});

				after(() => {
					admin.rolesReturnLink.click();
				});

				it('it should show the return to permissions', () => {
					admin.rolesReturnLink.isVisible().should.be.true;
				});

				it('it should show the new role name field', () => {
					admin.rolesNewRoleName.isVisible().should.be.true;
				});

				it('it should show the new role description field', () => {
					admin.rolesNewRoleDesc.isVisible().should.be.true;
				});

				it('it should show the new role scope', () => {
					admin.rolesNewRoleScope.isVisible().should.be.true;
				});
			});

			describe('admin role:', () => {
				before(() => {
					admin.rolesAdmin.waitForVisible(5000);
					admin.rolesAdmin.click();
					admin.usersInternalAdmin.waitForVisible(5000);
				});

				after(() => {
					admin.rolesReturnLink.click();
				});

				it('it should show internal admin', () => {
					admin.usersInternalAdmin.isVisible().should.be.true;
				});
			});
		});

		describe('[General Settings]', () => {
			before(() => {
				admin.settingsSearch.setValue('general');
				admin.generalLink.waitForVisible(5000);
				admin.generalLink.click();
				admin.settingsSearch.setValue('');
				admin.generalSiteUrl.waitForVisible(5000);
			});

			describe('general:', () => {
				it('it should show site url field', () => {
					admin.generalSiteUrl.isVisible().should.be.true;
				});

				it('it should change site url field', () => {
					admin.generalSiteUrl.setValue('something');
				});

				it('it should show the reset button', () => {
					admin.generalSiteUrlReset.waitForVisible(5000);
					admin.generalSiteUrlReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalSiteUrlReset.click();
				});

				it('it should that the site url field is different from the last input', () => {
					admin.generalSiteUrl.getText().should.not.equal('something');
				});

				it('it should show site name field', () => {
					admin.generalSiteName.isVisible().should.be.true;
				});

				it('it should change site name field', () => {
					admin.generalSiteName.setValue('something');
				});

				it('it should show the reset button', () => {
					admin.generalSiteNameReset.waitForVisible(5000);
					admin.generalSiteNameReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalSiteNameReset.click();
				});

				it('it should be that the name field is different from the last input', () => {
					admin.generalSiteName.getText().should.not.equal('something');
				});

				it('it should show language field', () => {
					admin.generalLanguage.isVisible().should.be.true;
				});

				it('it should change the language ', () => {
					admin.generalLanguage.click();
					admin.generalLanguagePtOption.waitForVisible(5000);
					admin.generalLanguagePtOption.click();
				});

				it('it should show the reset button', () => {
					admin.generalLanguageReset.waitForVisible(5000);
					admin.generalLanguageReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalLanguageReset.click();
				});

				it('it should show invalid self signed certs checkboxes', () => {
					admin.generalSelfSignedCertsFalse.isVisible().should.be.true;
					admin.generalSelfSignedCertsTrue.isVisible().should.be.true;
				});

				it('it should change the invalid self signed certs checkboxes', () => {
					admin.generalSelfSignedCertsTrue.click();
				});

				it('it should show the reset button', () => {
					admin.generalSelfSignedCertsReset.waitForVisible(5000);
					admin.generalSelfSignedCertsReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalSelfSignedCertsReset.click();
				});

				it('it should show favorite rooms checkboxes', () => {
					admin.generalFavoriteRoomFalse.isVisible().should.be.true;
					admin.generalFavoriteRoomTrue.isVisible().should.be.true;
				});

				it('it should change the favorite rooms checkboxes', () => {
					admin.generalFavoriteRoomFalse.click();
				});

				it('it should show the reset button', () => {
					admin.generalFavoriteRoomReset.waitForVisible(5000);
					admin.generalFavoriteRoomReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalFavoriteRoomReset.click();
				});

				it('it should show open first channel field', () => {
					admin.generalOpenFirstChannel.isVisible().should.be.true;
				});

				it('it should change open first channel field', () => {
					admin.generalOpenFirstChannel.setValue('something');
				});

				it('it should show the reset button', () => {
					admin.generalOpenFirstChannelReset.waitForVisible(5000);
					admin.generalOpenFirstChannelReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalOpenFirstChannelReset.click();
				});

				it('it should show cdn prefix field', () => {
					admin.generalCdnPrefix.isVisible().should.be.true;
				});

				it('it should change site url field', () => {
					admin.generalCdnPrefix.setValue('something');
				});

				it('it should show the reset button', () => {
					admin.generalCdnPrefixReset.waitForVisible(5000);
					admin.generalCdnPrefixReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalCdnPrefixReset.click();
				});

				it('it should show the force SSL checkboxes', () => {
					admin.generalForceSSLTrue.isVisible().should.be.true;
					admin.generalForceSSLFalse.isVisible().should.be.true;
				});

				it('it should change the force ssl checkboxes', () => {
					admin.generalForceSSLTrue.click();
				});

				it('it should show the reset button', () => {
					admin.generalForceSSLReset.waitForVisible(5000);
					admin.generalForceSSLReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalForceSSLReset.click();
				});

				it('it should show google tag id field', () => {
					admin.generalGoogleTagId.isVisible().should.be.true;
				});

				it('it should change google tag id field', () => {
					admin.generalGoogleTagId.setValue('something');
				});

				it('it should show the reset button', () => {
					admin.generalGoogleTagIdReset.waitForVisible(5000);
					admin.generalGoogleTagIdReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalGoogleTagIdReset.click();
				});

				it.skip('it should show bugsnag key field', () => {
					admin.generalBugsnagKey.isVisible().should.be.true;
				});

				it.skip('it should change bugsnag key id field', () => {
					admin.generalBugsnagKey.setValue('something');
				});

				it.skip('it should show the reset button', () => {
					admin.generalBugsnagKeyReset.waitForVisible(5000);
					admin.generalBugsnagKeyReset.isVisible().should.be.true;
				});

				it.skip('it should click the reset button', () => {
					admin.generalBugsnagKeyReset.click();
				});
			});

			describe('iframe:', () => {
				before(() => {
					admin.generalButtonExpandIframe.waitForVisible(5000);
					admin.generalButtonExpandIframe.click();
					admin.generalIframeSendTrue.waitForVisible(5000);
					admin.generalIframeSendTrue.scroll();
				});

				it('it should show iframe send checkboxes', () => {
					admin.generalIframeSendTrue.isVisible().should.be.true;
					admin.generalIframeSendFalse.isVisible().should.be.true;
				});

				it('it should show send origin field', () => {
					admin.generalIframeSendTargetOrigin.isVisible().should.be.true;
				});

				it('it should show iframe send checkboxes', () => {
					admin.generalIframeRecieveFalse.isVisible().should.be.true;
					admin.generalIframeRecieveTrue.isVisible().should.be.true;
				});

				it('it should show send origin field', () => {
					admin.generalIframeRecieveOrigin.isVisible().should.be.true;
				});
			});

			describe('notifications:', () => {
				before(() => {
					admin.generalButtonExpandNotifications.waitForVisible(5000);
					admin.generalButtonExpandNotifications.click();
					admin.generalNotificationsMaxRoomMembers.waitForVisible(5000);
					admin.generalNotificationsMaxRoomMembers.scroll();
				});

				it('it should show the max room members field', () => {
					admin.generalNotificationsMaxRoomMembers.isVisible().should.be.true;
				});
			});

			describe('rest api:', () => {
				before(() => {
					admin.generalButtonExpandRest.waitForVisible(5000);
					admin.generalButtonExpandRest.click();
					admin.generalRestApiUserLimit.waitForVisible(5000);
					admin.generalRestApiUserLimit.scroll();
				});

				it('it should show the API user add limit field', () => {
					admin.generalRestApiUserLimit.isVisible().should.be.true;
				});
			});

			describe('reporting:', () => {
				before(() => {
					admin.generalButtonExpandReporting.waitForVisible(5000);
					admin.generalButtonExpandReporting.click();
					admin.generalReportingTrue.waitForVisible(5000);
					admin.generalReportingTrue.scroll();
				});

				it('it should show the report to rocket.chat checkboxes', () => {
					admin.generalReportingTrue.isVisible().should.be.true;
					admin.generalReportingFalse.isVisible().should.be.true;
				});
			});

			describe('stream cast:', () => {
				before(() => {
					admin.generalButtonExpandStreamCast.waitForVisible(5000);
					admin.generalButtonExpandStreamCast.click();
					admin.generalStreamCastAdress.waitForVisible(5000);
					admin.generalStreamCastAdress.scroll();
				});

				it('it should show the stream cast adress field', () => {
					admin.generalStreamCastAdress.isVisible().should.be.true;
				});
			});

			describe('stream cast:', () => {
				before(() => {
					admin.generalButtonExpandUTF8.waitForVisible(5000);
					admin.generalButtonExpandUTF8.click();
					admin.generalUTF8Regex.waitForVisible(5000);
					admin.generalUTF8Regex.scroll();
				});

				it('it should show the utf8 regex field', () => {
					admin.generalUTF8Regex.isVisible().should.be.true;
				});

				it('it should show the utf8 names slug checkboxes', () => {
					admin.generalUTF8NamesSlugTrue.isVisible().should.be.true;
					admin.generalUTF8NamesSlugFalse.isVisible().should.be.true;
				});
			});
		});

		describe('[Accounts]', () => {
			before(() => {
				admin.settingsSearch.setValue('accounts');
				admin.accountsLink.waitForVisible(5000);
				admin.accountsLink.click();
				admin.settingsSearch.setValue('');
			});

			describe('default user preferences', () => {
				before(() => {
					if (admin.accountsButtonCollapseDefaultUserPreferences.isVisible()) {
						admin.accountsButtonCollapseDefaultUserPreferences.click();
					}
					admin.accountsButtonExpandDefaultUserPreferences.waitForVisible(5000);
					admin.accountsButtonExpandDefaultUserPreferences.click();
					admin.accountsNotificationDuration.waitForVisible(5000);
				});

				it('it should show the enable auto away field', () => {
					admin.accountsEnableAutoAwayTrue.scroll();
					admin.accountsEnableAutoAwayTrue.isVisible().should.be.true;
					admin.accountsEnableAutoAwayFalse.isVisible().should.be.true;
				});
				it('the enable auto away field value should be true', () => {
					admin.accountsEnableAutoAwayTrue.isSelected().should.be.false;
					admin.accountsEnableAutoAwayFalse.isSelected().should.be.true;
				});

				it('it should show the idle timeout limit field', () => {
					admin.accountsIdleTimeoutLimit.click();
					admin.accountsIdleTimeoutLimit.isVisible().should.be.true;
				});
				it('the idle timeout limit field value should be 0', () => {
					admin.accountsIdleTimeoutLimit.getValue().should.equal('300');
				});

				it('it should show the notifications durations field', () => {
					admin.accountsNotificationDuration.click();
					admin.accountsNotificationDuration.isVisible().should.be.true;
				});
				it('the notification duration field value should be 0', () => {
					admin.accountsNotificationDuration.getValue().should.equal('0');
				});

				it('it should show the audio notifications select field', () => {
					admin.accountsAudioNotifications.click();
					admin.accountsAudioNotifications.isVisible().should.be.true;
				});
				it('the audio notifications field value should be mentions', () => {
					admin.accountsAudioNotifications.getValue().should.equal('mentions');
				});

				it('it should show the desktop audio notifications select field', () => {
					admin.accountsDesktopNotifications.click();
					admin.accountsDesktopNotifications.isVisible().should.be.true;
				});
				it('the desktop audio notifications field value should be mentions', () => {
					admin.accountsDesktopNotifications.getValue().should.equal('mentions');
				});

				it('it should show the mobile audio notifications select field', () => {
					admin.accountsMobileNotifications.click();
					admin.accountsMobileNotifications.isVisible().should.be.true;
				});
				it('the mobile audio notifications field value should be mentions', () => {
					admin.accountsMobileNotifications.getValue().should.equal('mentions');
				});

				it('it should show the unread tray icon alert field', () => {
					admin.accountsUnreadAlertTrue.scroll();
					admin.accountsUnreadAlertTrue.isVisible().should.be.true;
					admin.accountsUnreadAlertFalse.isVisible().should.be.true;
				});
				it('the unread tray icon alert field value should be true', () => {
					admin.accountsUnreadAlertTrue.isSelected().should.be.true;
					admin.accountsUnreadAlertFalse.isSelected().should.be.false;
				});

				it('it should show the use emojis field', () => {
					admin.accountsUseEmojisTrue.scroll();
					admin.accountsUseEmojisTrue.isVisible().should.be.true;
					admin.accountsUseEmojisFalse.isVisible().should.be.true;
				});
				it('the use emojis field value should be true', () => {
					admin.accountsUseEmojisTrue.isSelected().should.be.true;
					admin.accountsUseEmojisFalse.isSelected().should.be.false;
				});

				it('it should show the convert ascii to emoji field', () => {
					admin.accountsConvertAsciiEmojiTrue.scroll();
					admin.accountsConvertAsciiEmojiTrue.isVisible().should.be.true;
					admin.accountsConvertAsciiEmojiFalse.isVisible().should.be.true;
				});
				it('the convert ascii to emoji field value should be true', () => {
					admin.accountsConvertAsciiEmojiTrue.isSelected().should.be.true;
					admin.accountsConvertAsciiEmojiFalse.isSelected().should.be.false;
				});

				it('it should show the auto load images field', () => {
					admin.accountsAutoImageLoadTrue.scroll();
					admin.accountsAutoImageLoadTrue.isVisible().should.be.true;
					admin.accountsAutoImageLoadFalse.isVisible().should.be.true;
				});
				it('the auto load images field value should be true', () => {
					admin.accountsAutoImageLoadTrue.isSelected().should.be.true;
					admin.accountsAutoImageLoadFalse.isSelected().should.be.false;
				});

				it('it should show the save mobile bandwidth field', () => {
					admin.accountsSaveMobileBandwidthTrue.scroll();
					admin.accountsSaveMobileBandwidthTrue.isVisible().should.be.true;
					admin.accountsSaveMobileBandwidthFalse.isVisible().should.be.true;
				});
				it('the save mobile bandwidth field value should be true', () => {
					admin.accountsSaveMobileBandwidthTrue.isSelected().should.be.true;
					admin.accountsSaveMobileBandwidthFalse.isSelected().should.be.false;
				});

				it('it should show the collapse embedded media by default field', () => {
					admin.accountsCollapseMediaByDefaultTrue.scroll();
					admin.accountsCollapseMediaByDefaultTrue.isVisible().should.be.true;
					admin.accountsCollapseMediaByDefaultFalse.isVisible().should.be.true;
				});
				it('the collapse embedded media by default field value should be false', () => {
					admin.accountsCollapseMediaByDefaultTrue.isSelected().should.be.false;
					admin.accountsCollapseMediaByDefaultFalse.isSelected().should.be.true;
				});

				it('it should show the hide usernames field', () => {
					admin.accountsHideUsernamesTrue.scroll();
					admin.accountsHideUsernamesTrue.isVisible().should.be.true;
					admin.accountsHideUsernamesFalse.isVisible().should.be.true;
				});
				it('the hide usernames field value should be false', () => {
					admin.accountsHideUsernamesTrue.isSelected().should.be.false;
					admin.accountsHideUsernamesFalse.isSelected().should.be.true;
				});

				it('it should show the hide roles field', () => {
					admin.accountsHideRolesTrue.scroll();
					admin.accountsHideRolesTrue.isVisible().should.be.true;
					admin.accountsHideRolesFalse.isVisible().should.be.true;
				});
				it('the hide roles field value should be false', () => {
					admin.accountsHideRolesTrue.isSelected().should.be.false;
					admin.accountsHideRolesFalse.isSelected().should.be.true;
				});

				it('it should show the hide right sidebar with click field', () => {
					admin.accountsHideFlexTabTrue.scroll();
					admin.accountsHideFlexTabTrue.isVisible().should.be.true;
					admin.accountsHideFlexTabFalse.isVisible().should.be.true;
				});
				it('the hide right sidebar with click field value should be false', () => {
					admin.accountsHideFlexTabTrue.isSelected().should.be.false;
					admin.accountsHideFlexTabFalse.isSelected().should.be.true;
				});

				it('it should show the hide avatars field', () => {
					admin.accountsHideAvatarsTrue.scroll();
					admin.accountsHideAvatarsTrue.isVisible().should.be.true;
					admin.accountsHideAvatarsFalse.isVisible().should.be.true;
				});
				it('the hide avatars field value should be false', () => {
					admin.accountsHideAvatarsTrue.isSelected().should.be.false;
					admin.accountsHideAvatarsFalse.isSelected().should.be.true;
				});

				it('it should show the sidebar channel list mode field', () => {
					admin.accountsRoomsListExhibitionMode.click();
					admin.accountsRoomsListExhibitionMode.isVisible().should.be.true;
				});
				it('the sidebar channel list mode field value should be category', () => {
					admin.accountsRoomsListExhibitionMode.getValue().should.equal('category');
				});

				it('it should show the merge channels field', () => {
					admin.accountsMergeChannelsTrue.scroll();
					admin.accountsMergeChannelsTrue.isVisible().should.be.true;
					admin.accountsMergeChannelsFalse.isVisible().should.be.true;
				});
				it('the merge channels field value should be false', () => {
					admin.accountsMergeChannelsTrue.isSelected().should.be.false;
					admin.accountsMergeChannelsFalse.isSelected().should.be.true;
				});

				it('it should show the enter key behavior field', () => {
					admin.accountsSendOnEnter.click();
					admin.accountsSendOnEnter.isVisible().should.be.true;
				});
				it('the enter key behavior field value should be normal', () => {
					admin.accountsSendOnEnter.getValue().should.equal('normal');
				});

				it('it should show the view mode field', () => {
					admin.accountsViewMode.click();
					admin.accountsViewMode.isVisible().should.be.true;
				});
				it('the view mode field value should be 0', () => {
					admin.accountsViewMode.getValue().should.equal('0');
				});

				it('it should show the offline email notification field', () => {
					admin.accountsEmailNotificationMode.click();
					admin.accountsEmailNotificationMode.isVisible().should.be.true;
				});
				it('the offline email notification field value should be all', () => {
					admin.accountsEmailNotificationMode.getValue().should.equal('all');
				});

				it('it should show the room counter sidebar field', () => {
					admin.accountsRoomCounterSidebarTrue.scroll();
					admin.accountsRoomCounterSidebarTrue.isVisible().should.be.true;
					admin.accountsRoomCounterSidebarFalse.isVisible().should.be.true;
				});
				it('the room counter sidebar field value should be false', () => {
					admin.accountsRoomCounterSidebarTrue.isSelected().should.be.false;
					admin.accountsRoomCounterSidebarFalse.isSelected().should.be.true;
				});

				it('it should show the new room notification field', () => {
					admin.accountsNewRoomNotification.click();
					admin.accountsNewRoomNotification.isVisible().should.be.true;
				});
				it('the new room notification field value should be door', () => {
					admin.accountsNewRoomNotification.getValue().should.equal('door');
				});

				it('it should show the new message notification field', () => {
					admin.accountsNewMessageNotification.click();
					admin.accountsNewMessageNotification.isVisible().should.be.true;
				});
				it('the new message notification field value should be chime', () => {
					admin.accountsNewMessageNotification.getValue().should.equal('chime');
				});

				it('it should show the notification sound volume field', () => {
					admin.accountsNotificationsSoundVolume.click();
					admin.accountsNotificationsSoundVolume.isVisible().should.be.true;
				});
				it('the notification sound volume field value should be 100', () => {
					admin.accountsNotificationsSoundVolume.getValue().should.equal('100');
				});
			});
		});
	});
});
