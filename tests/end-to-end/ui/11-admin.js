import sideNav from '../../pageobjects/side-nav.page';
import flexTab from '../../pageobjects/flex-tab.page';
import admin from '../../pageobjects/administration.page';
import { checkIfUserIsAdmin } from '../../data/checks';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';

describe('[Administration]', () => {
	before(() => {
		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		// sideNav.spotlightSearch.waitForVisible(10000);
		// sideNav.general.waitForVisible(5000);
		// sideNav.general.click();
	});

	after(() => {
		sideNav.preferencesClose.waitForVisible(5000);
		sideNav.preferencesClose.click();
	});

	describe('[Admin View]', () => {
		before(() => {
			sideNav.sidebarMenu.waitForVisible(5000);
			sideNav.sidebarMenu.click();
			sideNav.admin.waitForVisible(5000);
		});

		it('it should enter the admin view', () => {
			sideNav.admin.click();
			admin.flexNavContent.waitForVisible(5000);
		});

		describe('info:', () => {
			before(() => {
				admin.infoLink.waitForVisible(5000);
				admin.infoLink.click();
				admin.infoRocketChatTable.waitForVisible(10000);
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

			it('the first title should be Runtime Environment', () => {
				admin.infoRuntimeTableTitle.moveToObject();
				admin.infoRuntimeTableTitle.getText().should.equal('Runtime Environment');
			});

			it('it should show the Runtime Environment table', () => {
				admin.infoRuntimeTable.isVisible().should.be.true;
			});

			it('the first title should be Build Environment', () => {
				admin.infoBuildTableTitle.moveToObject();
				admin.infoBuildTableTitle.getText().should.equal('Build Environment');
			});

			it('it should show the Build Environment table', () => {
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
					// add value triggers a key event that changes search±±±±±±±±±
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
			// it cant find the user if there is too many users
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
			before(() => {
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

				it('it should show invalid self signed certs toggle', () => {
					admin.generalSelfSignedCerts.$('..').isVisible().should.be.true;
				});

				it('it should change the invalid self signed certs toggle', () => {
					if (!admin.generalSelfSignedCerts.isSelected()) {
						admin.generalSelfSignedCerts.$('..').click();
					}
				});

				it('it should show the reset button', () => {
					admin.generalSelfSignedCertsReset.waitForVisible(5000);
					admin.generalSelfSignedCertsReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalSelfSignedCertsReset.click();
				});

				it('it should show favorite rooms checkboxes', () => {
					admin.generalFavoriteRoom.$('..').isVisible().should.be.true;
				});

				it('it should change the favorite rooms toggle', () => {
					if (admin.generalFavoriteRoom.isSelected()) {
						admin.generalFavoriteRoom.$('..').click();
					}
				});

				it('it should show the reset button', () => {
					admin.generalFavoriteRoomReset.waitForVisible(5000);
					admin.generalFavoriteRoomReset.isVisible().should.be.true;
				});

				it('it should click the reset button', () => {
					admin.generalFavoriteRoomReset.click();
				});

				it('it should show open first channel field', () => {
					admin.generalOpenFirstChannel.waitForVisible(5000);
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

				it('it should show the force SSL toggle', () => {
					admin.generalForceSSL.$('..').isVisible().should.be.true;
				});

				it('it should change the force ssl toggle', () => {
					if (!admin.generalForceSSL.isSelected()) {
						admin.generalForceSSL.$('..').click();
					}
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
					admin.generalSectionIframeIntegration.waitForVisible(5000);
					admin.generalSectionIframeIntegration.$('[aria-expanded="false"]').click();
					admin.generalIframeSend.$('..').scroll();
				});

				it('it should show iframe send toggle', () => {
					admin.generalIframeSend.$('..').isVisible().should.be.true;
				});

				it('it should show send origin field', () => {
					admin.generalIframeSendTargetOrigin.isVisible().should.be.true;
				});

				it('it should show iframe send toggle', () => {
					admin.generalIframeRecieve.$('..').isVisible().should.be.true;
				});

				it('it should show send origin field', () => {
					admin.generalIframeRecieveOrigin.isVisible().should.be.true;
				});
			});

			describe('notifications:', () => {
				before(() => {
					admin.generalSectionNotifications.waitForVisible(5000);
					admin.generalSectionNotifications.$('[aria-expanded="false"]').click();
					admin.generalNotificationsMaxRoomMembers.scroll();
				});

				it('it should show the max room members field', () => {
					admin.generalNotificationsMaxRoomMembers.isVisible().should.be.true;
				});
			});

			describe('rest api:', () => {
				before(() => {
					admin.generalSectionRestApi.waitForVisible(5000);
					admin.generalSectionRestApi.$('[aria-expanded="false"]').click();
					admin.generalRestApiUserLimit.waitForVisible(5000);
					admin.generalRestApiUserLimit.scroll();
				});

				it('it should show the API user add limit field', () => {
					admin.generalRestApiUserLimit.isVisible().should.be.true;
				});
			});

			describe('reporting:', () => {
				before(() => {
					admin.generalSectionReporting.waitForVisible(5000);
					admin.generalSectionReporting.$('[aria-expanded="false"]').click();
					admin.generalReporting.$('..').scroll();
				});

				it('it should show the report to rocket.chat toggle', () => {
					admin.generalReporting.$('..').isVisible().should.be.true;
				});
			});

			describe('stream cast:', () => {
				before(() => {
					admin.generalSectionStreamCast.waitForVisible(5000);
					admin.generalSectionStreamCast.$('[aria-expanded="false"]').click();
					admin.generalStreamCastAdress.waitForVisible(5000);
					admin.generalStreamCastAdress.scroll();
				});

				it('it should show the stream cast adress field', () => {
					admin.generalStreamCastAdress.isVisible().should.be.true;
				});
			});

			describe('utf8:', () => {
				before(() => {
					admin.generalSectionUTF8.waitForVisible(5000);
					admin.generalSectionUTF8.$('[aria-expanded="false"]').click();
					admin.generalUTF8Regex.waitForVisible(5000);
					admin.generalUTF8Regex.scroll();
				});

				it('it should show the utf8 regex field', () => {
					admin.generalUTF8Regex.isVisible().should.be.true;
				});

				it('it should show the utf8 names slug checkboxes', () => {
					admin.generalUTF8NamesSlug.$('..').isVisible().should.be.true;
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
					if (admin.accountsSectionDefaultUserPreferences.$('[aria-expanded="true"]').isVisible()) {
						admin.accountsSectionDefaultUserPreferences.$('[aria-expanded="true"]').click();
					}
					admin.accountsSectionDefaultUserPreferences.$('[aria-expanded="false"]').waitForVisible(5000);
					admin.accountsSectionDefaultUserPreferences.$('[aria-expanded="false"]').click();
					admin.accountsNotificationDuration.waitForVisible(5000);
				});

				it('it should show the enable auto away field', () => {
					admin.accountsEnableAutoAway.$('..').scroll();
					admin.accountsEnableAutoAway.$('..').isVisible().should.be.true;
				});
				it('the enable auto away field value should be true', () => {
					admin.accountsEnableAutoAway.isSelected().should.be.true;
				});

				it('it should show the idle timeout limit field', () => {
					admin.accountsidleTimeLimit.click();
					admin.accountsidleTimeLimit.isVisible().should.be.true;
				});
				it('the idle timeout limit field value should be 300', () => {
					admin.accountsidleTimeLimit.getValue().should.equal('300');
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
				it('the desktop audio notifications field value should be all', () => {
					admin.accountsDesktopNotifications.getValue().should.equal('all');
				});

				it('it should show the mobile notifications select field', () => {
					admin.accountsMobileNotifications.click();
					admin.accountsMobileNotifications.isVisible().should.be.true;
				});
				it('the mobile notifications field value should be all', () => {
					admin.accountsMobileNotifications.getValue().should.equal('all');
				});

				it('it should show the unread tray icon alert field', () => {
					admin.accountsUnreadAlert.$('..').scroll();
					admin.accountsUnreadAlert.$('..').isVisible().should.be.true;
				});
				it('the unread tray icon alert field value should be true', () => {
					admin.accountsUnreadAlert.isSelected().should.be.true;
				});

				it('it should show the use emojis field', () => {
					admin.accountsUseEmojis.$('..').scroll();
					admin.accountsUseEmojis.$('..').isVisible().should.be.true;
				});
				it('the use emojis field value should be true', () => {
					admin.accountsUseEmojis.isSelected().should.be.true;
				});

				it('it should show the convert ascii to emoji field', () => {
					admin.accountsConvertAsciiEmoji.$('..').scroll();
					admin.accountsConvertAsciiEmoji.$('..').isVisible().should.be.true;
				});
				it('the convert ascii to emoji field value should be true', () => {
					admin.accountsConvertAsciiEmoji.isSelected().should.be.true;
				});

				it('it should show the auto load images field', () => {
					admin.accountsAutoImageLoad.$('..').scroll();
					admin.accountsAutoImageLoad.$('..').isVisible().should.be.true;
				});
				it('the auto load images field value should be true', () => {
					admin.accountsAutoImageLoad.isSelected().should.be.true;
				});

				it('it should show the save mobile bandwidth field', () => {
					admin.accountsSaveMobileBandwidth.$('..').scroll();
					admin.accountsSaveMobileBandwidth.$('..').isVisible().should.be.true;
				});
				it('the save mobile bandwidth field value should be true', () => {
					admin.accountsSaveMobileBandwidth.isSelected().should.be.true;
				});

				it('it should show the collapse embedded media by default field', () => {
					admin.accountsCollapseMediaByDefault.$('..').scroll();
					admin.accountsCollapseMediaByDefault.$('..').isVisible().should.be.true;
				});
				it('the collapse embedded media by default field value should be false', () => {
					admin.accountsCollapseMediaByDefault.isSelected().should.be.false;
				});

				it('it should show the hide usernames field', () => {
					admin.accountsHideUsernames.$('..').scroll();
					admin.accountsHideUsernames.$('..').isVisible().should.be.true;
				});
				it('the hide usernames field value should be false', () => {
					admin.accountsHideUsernames.isSelected().should.be.false;
				});

				it('it should show the hide roles field', () => {
					admin.accountsHideRoles.$('..').scroll();
					admin.accountsHideRoles.$('..').isVisible().should.be.true;
				});
				it('the hide roles field value should be false', () => {
					admin.accountsHideRoles.isSelected().should.be.false;
				});

				it('it should show the hide right sidebar with click field', () => {
					admin.accountsHideFlexTab.$('..').scroll();
					admin.accountsHideFlexTab.$('..').isVisible().should.be.true;
				});
				it('the hide right sidebar with click field value should be false', () => {
					admin.accountsHideFlexTab.isSelected().should.be.false;
				});

				it('it should show the hide avatars field', () => {
					admin.accountsHideAvatars.$('..').scroll();
					admin.accountsHideAvatars.$('..').isVisible().should.be.true;
				});
				it('the hide avatars field value should be false', () => {
					admin.accountsHideAvatars.isSelected().should.be.false;
				});

				it('it should show the enter key behavior field', () => {
					browser.scroll(0, 500);
					admin.accountsSendOnEnter.click();
					admin.accountsSendOnEnter.isVisible().should.be.true;
				});
				it('the enter key behavior field value should be normal', () => {
					admin.accountsSendOnEnter.getValue().should.equal('normal');
				});

				it('it should show the messagebox view mode field', () => {
					admin.accountsMessageViewMode.moveToObject();
					admin.accountsMessageViewMode.click();
					admin.accountsMessageViewMode.isVisible().should.be.true;
				});
				it('the view mode field value should be 0', () => {
					admin.accountsMessageViewMode.getValue().should.equal('0');
				});

				it('it should show the offline email notification field', () => {
					admin.accountsEmailNotificationMode.click();
					admin.accountsEmailNotificationMode.isVisible().should.be.true;
				});
				it('the offline email notification field value should be all', () => {
					admin.accountsEmailNotificationMode.getValue().should.equal('mentions');
				});

				// it('it should show the room counter sidebar field', () => {
				// 	admin.accountsRoomCounterSidebar.$('..').scroll();
				// 	admin.accountsRoomCounterSidebar.$('..').isVisible().should.be.true;
				// });
				// it('the room counter sidebar field value should be false', () => {
				// 	admin.accountsRoomCounterSidebar.isSelected().should.be.false;
				// });

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
