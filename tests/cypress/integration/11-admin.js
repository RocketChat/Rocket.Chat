import sideNav from '../pageobjects/side-nav.page';
import flexTab from '../pageobjects/flex-tab.page';
import admin from '../pageobjects/administration.page';
import { checkIfUserIsValid } from '../../data/checks';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';

describe('[Administration]', () => {
	before(() => {
		checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
	});

	after(() => {
		sideNav.preferencesClose.click();
	});

	describe('[Admin View]', () => {
		before(() => {
			sideNav.sidebarMenu.click();
		});

		it('it should enter the admin view', () => {
			sideNav.admin.click();
		});

		describe('info:', () => {
			before(() => {
				admin.infoLink.click();
			});
			it('the first title should be Rocket.Chat', () => {
				admin.infoRocketChatTableTitle.should('contain', 'Rocket.Chat');
			});

			it('it should show the rocket chat table', () => {
				admin.infoRocketChatTable.should('be.visible');
			});

			it('the second title should be Commit', () => {
				admin.infoCommitTableTitle.should('contain', 'Commit');
			});

			it('it should show the Commit table', () => {
				admin.infoCommitTable.should('be.visible');
			});

			it('the first title should be Runtime Environment', () => {
				admin.infoRuntimeTableTitle.scrollIntoView();
				admin.infoRuntimeTableTitle.should('contain', 'Runtime Environment');
			});

			it('it should show the Runtime Environment table', () => {
				admin.infoRuntimeTable.should('be.visible');
			});

			it('the first title should be Build Environment', () => {
				admin.infoBuildTableTitle.scrollIntoView();
				admin.infoBuildTableTitle.should('contain', 'Build Environment');
			});

			it('it should show the Build Environment table', () => {
				admin.infoBuildTable.should('be.visible');
			});
		});

		describe.skip('[Rooms]', () => {
			before(() => {
				admin.roomsLink.click();
			});

			after(() => {
				admin.infoLink.click();
			});

			describe('render:', () => {
				it('it should show the search form', () => {
					admin.roomsSearchForm.should('be.visible');
				});

				it('it should show the rooms Filter', () => {
					admin.roomsFilter.should('be.visible');
				});

				it('it should show the channel checkbox', () => {
					admin.roomsChannelsCheckbox.should('be.visible');
				});

				it('it should show the direct messsage checkbox', () => {
					admin.roomsDirectCheckbox.should('be.visible');
				});

				it('it should show the Private channel checkbox', () => {
					admin.roomsPrivateCheckbox.should('be.visible');
				});

				it('it should show the general channel', () => {
					admin.roomsGeneralChannel.should('be.visible');
				});
			});

			describe('filter text:', () => {
				before(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.type('general');
				});

				after(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.type('');
				});

				it('it should show the general channel', () => {
					admin.roomsGeneralChannel.should('be.visible');
				});
			});

			describe('filter text with wrong channel:', () => {
				before(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.type('something else');
				});

				after(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.type('');
				});

				it('it should not show the general channel', () => {
					admin.roomsGeneralChannel.should('not.be.visible');
				});
			});

			describe('filter checkbox:', () => {
				let checkbox = 1;
				before(() => {
					admin.roomsFilter.type('');
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
					admin.roomsGeneralChannel.should('be.visible');
				});

				it('it should not show the general channel', () => {
					admin.roomsGeneralChannel.should('not.be.visible');
				});

				it('it should not show the general channel', () => {
					admin.roomsGeneralChannel.should('not.be.visible');
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
				admin.usersFilter.should('be.visible');
			});


			it('it should show rocket.cat', () => {
			// it cant find the user if there is too many users
				admin.usersRocketCat.should('be.visible');
			});

			describe('filter text:', () => {
				before(() => {
					admin.usersFilter.click();
					admin.usersFilter.type('Rocket.Cat');
				});

				after(() => {
					admin.usersFilter.click();
					admin.usersFilter.type('');
				});

				it('it should show rocket.cat', () => {
					admin.usersRocketCat.waitForVisible();
					admin.usersRocketCat.should('be.visible');
				});
			});

			describe('filter text with wrong user:', () => {
				before(() => {
					admin.usersFilter.click();
					admin.usersFilter.type('something else');
				});

				after(() => {
					admin.usersFilter.click();
					admin.usersFilter.type('');
				});

				it('it should not show rocket.cat', () => {
					admin.usersRocketCat.should('not.be.visible');
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
						flexTab.usersSendInvitationTextArea.should('be.visible');
					});

					it('it should show the cancel button', () => {
						flexTab.usersButtonCancel.should('be.visible');
					});

					it('it should show the send button', () => {
						flexTab.usersSendInvitationSend.should('be.visible');
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
						flexTab.usersAddUserName.should('be.visible');
					});

					it('it should show the username field', () => {
						flexTab.usersAddUserUsername.should('be.visible');
					});

					it('it should show the email field', () => {
						flexTab.usersAddUserEmail.should('be.visible');
					});

					it('it should show the verified checkbox', () => {
						flexTab.usersAddUserVerifiedCheckbox.should('be.visible');
					});

					it('it should show the password field', () => {
						flexTab.usersAddUserPassword.should('be.visible');
					});

					it('it should show the random password button', () => {
						flexTab.usersAddUserRandomPassword.should('be.visible');
					});

					it('it should show the require password change button', () => {
						flexTab.usersAddUserChangePasswordCheckbox.should('be.visible');
					});

					it('it should show the role dropdown', () => {
						flexTab.usersAddUserRoleList.waitForVisible(5000);
						flexTab.usersAddUserRoleList.should('be.visible');
					});

					it('ít should show the add role button', () => {
						flexTab.usersAddUserRoleButton.waitForVisible(5000);
						flexTab.usersAddUserRoleButton.should('be.visible');
					});

					it('it should show the join default channel checkbox', () => {
						flexTab.usersAddUserDefaultChannelCheckbox.should('be.visible');
					});

					it('it should show the send welcome checkbox', () => {
						flexTab.usersAddUserWelcomeEmailCheckbox.should('be.visible');
					});

					it('it should show the save button', () => {
						flexTab.usersButtonSave.should('be.visible');
					});

					it('it should show the cancel button', () => {
						flexTab.usersButtonCancel.should('be.visible');
					});
				});
			});
		});

		describe('[Roles]', () => {
			before(() => {
				admin.permissionsLink.click();
			});

			after(() => {
				admin.infoLink.click();
			});

			it('it should show the permissions grid', () => {
				admin.rolesPermissionGrid.should('be.visible');
			});

			it('it should show the new role button', () => {
				admin.rolesNewRolesButton.should('be.visible');
			});

			it('it should show the admin link', () => {
				admin.rolesAdmin.should('be.visible');
			});

			describe('new role:', () => {
				before(() => {
					admin.rolesNewRolesButton.click();
				});

				after(() => {
					admin.rolesReturnLink.first().click();
				});

				it('it should show the return to permissions', () => {
					admin.rolesReturnLink.should('be.visible');
				});

				it('it should show the new role name field', () => {
					admin.rolesNewRoleName.should('be.visible');
				});

				it('it should show the new role description field', () => {
					admin.rolesNewRoleDesc.should('be.visible');
				});

				it('it should show the new role scope', () => {
					admin.rolesNewRoleScope.should('be.visible');
				});
			});

			describe('admin role:', () => {
				before(() => {
					admin.rolesAdmin.click();
				});

				after(() => {
					admin.rolesReturnLink.first().click();
				});

				it('it should show internal admin', () => {
					admin.usersInternalAdmin.should('be.visible');
				});
			});
		});

		describe('[General Settings]', () => {
			before(() => {
				admin.settingsSearch.type('general');
				admin.generalLink.click();
				admin.settingsSearch.clear();
			});

			describe('general:', () => {
				it('it should show site url field', () => {
					admin.generalSiteUrl.should('be.visible');
				});

				it('it should change site url field', () => {
					admin.generalSiteUrl.type('something');
				});

				it('it should show the reset button', () => {
					admin.generalSiteUrlReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					admin.generalSiteUrlReset.click();
				});

				it('it should that the site url field is different from the last input', () => {
					admin.generalSiteUrl.should('not.contain', 'something');
				});

				it('it should show site name field', () => {
					admin.generalSiteName.should('be.visible');
				});

				it('it should change site name field', () => {
					admin.generalSiteName.type('something');
				});

				it('it should show the reset button', () => {
					admin.generalSiteNameReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					admin.generalSiteNameReset.click();
				});

				it('it should be that the name field is different from the last input', () => {
					admin.generalSiteName.should('not.contain', 'something');
				});

				it('it should show language field', () => {
					admin.generalLanguage.should('be.visible');
				});

				it('it should change the language ', () => {
					admin.generalLanguage.select('pt');
				});

				it('it should show the reset button', () => {
					admin.generalLanguageReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					admin.generalLanguageReset.click();
				});

				it('it should show invalid self signed certs toggle', () => {
					admin.generalSelfSignedCerts.parent().should('be.visible');
				});

				it('it should change the invalid self signed certs toggle', () => {
					admin.generalSelfSignedCerts.parent().click();
				});

				it('it should show the reset button', () => {
					admin.generalSelfSignedCertsReset.should('be.visible');
				});

				it('it should click the reset button', () => {
					admin.generalSelfSignedCertsReset.click();
				});

				it('it should show favorite rooms checkboxes', () => {
					admin.generalFavoriteRoom.parent().should('be.visible');
				});

				it('it should change the favorite rooms toggle', () => {
					admin.generalFavoriteRoom.parent().click();
				});

				it('it should show the reset button', () => {
					admin.generalFavoriteRoomReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					admin.generalFavoriteRoomReset.click();
				});

				it('it should show open first channel field', () => {
					admin.generalOpenFirstChannel.should('be.visible');
				});

				it('it should change open first channel field', () => {
					admin.generalOpenFirstChannel.type('something');
				});

				it('it should show the reset button', () => {
					admin.generalOpenFirstChannelReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					admin.generalOpenFirstChannelReset.click();
				});

				it('it should show cdn prefix field', () => {
					admin.generalCdnPrefix.should('be.visible');
				});

				it('it should change site url field', () => {
					admin.generalCdnPrefix.type('something');
				});

				it('it should show the reset button', () => {
					admin.generalCdnPrefixReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					admin.generalCdnPrefixReset.click();
				});

				it('it should show the force SSL toggle', () => {
					admin.generalForceSSL.parent().should('be.visible');
				});

				it('it should change the force ssl toggle', () => {
					admin.generalForceSSL.parent().click();
				});

				it('it should show the reset button', () => {
					admin.generalForceSSLReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					admin.generalForceSSLReset.click();
				});

				it('it should show google tag id field', () => {
					admin.generalGoogleTagId.should('be.visible');
				});

				it('it should change google tag id field', () => {
					admin.generalGoogleTagId.type('something');
				});

				it('it should show the reset button', () => {
					admin.generalGoogleTagIdReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					admin.generalGoogleTagIdReset.click();
				});

				it.skip('it should show bugsnag key field', () => {
					admin.generalBugsnagKey.should('be.visible');
				});

				it.skip('it should change bugsnag key id field', () => {
					admin.generalBugsnagKey.type('something');
				});

				it.skip('it should show the reset button', () => {
					admin.generalBugsnagKeyReset.scrollIntoView().should('be.visible');
				});

				it.skip('it should click the reset button', () => {
					admin.generalBugsnagKeyReset.click();
				});
			});

			describe('iframe:', () => {
				before(() => {
					admin.generalSectionIframeIntegration.find('[aria-expanded="false"]').click();
					admin.generalIframeSend.parent().scrollIntoView();
				});

				it('it should show iframe send toggle', () => {
					admin.generalIframeSend.parent().should('be.visible');
				});

				it('it should show send origin field', () => {
					admin.generalIframeSendTargetOrigin.should('be.visible');
				});

				it('it should show iframe send toggle', () => {
					admin.generalIframeRecieve.parent().should('be.visible');
				});

				it('it should show send origin field', () => {
					admin.generalIframeRecieveOrigin.should('be.visible');
				});
			});

			describe('notifications:', () => {
				before(() => {
					admin.generalSectionNotifications.find('[aria-expanded="false"]').click();
					admin.generalNotificationsMaxRoomMembers.scrollIntoView();
				});

				it('it should show the max room members field', () => {
					admin.generalNotificationsMaxRoomMembers.should('be.visible');
				});
			});

			describe('rest api:', () => {
				before(() => {
					admin.generalSectionRestApi.find('[aria-expanded="false"]').click();
					admin.generalRestApiUserLimit.scrollIntoView();
				});

				it('it should show the API user add limit field', () => {
					admin.generalRestApiUserLimit.should('be.visible');
				});
			});

			describe('reporting:', () => {
				before(() => {
					admin.generalSectionReporting.find('[aria-expanded="false"]').click();
					admin.generalReporting.parent().scrollIntoView();
				});

				it('it should show the report to rocket.chat toggle', () => {
					admin.generalReporting.parent().should('be.visible');
				});
			});

			describe('stream cast:', () => {
				before(() => {
					admin.generalSectionStreamCast.find('[aria-expanded="false"]').click();
					admin.generalStreamCastAdress.scrollIntoView();
				});

				it('it should show the stream cast adress field', () => {
					admin.generalStreamCastAdress.should('be.visible');
				});
			});

			describe('utf8:', () => {
				before(() => {
					admin.generalSectionUTF8.find('[aria-expanded="false"]').click();
					admin.generalUTF8Regex.scrollIntoView();
				});

				it('it should show the utf8 regex field', () => {
					admin.generalUTF8Regex.should('be.visible');
				});

				it('it should show the utf8 names slug checkboxes', () => {
					admin.generalUTF8NamesSlug.parent().should('be.visible');
				});
			});
		});

		describe('[Accounts]', () => {
			before(() => {
				admin.settingsSearch.type('accounts');
				admin.accountsLink.click();
				admin.settingsSearch.clear();
			});

			describe('default user preferences', () => {
				before(() => {
					admin.accountsSectionDefaultUserPreferences.find('[aria-expanded="false"]').click();
				});

				it('it should show the enable auto away field', () => {
					admin.accountsEnableAutoAway.parent().scrollIntoView();
					admin.accountsEnableAutoAway.parent().should('be.visible');
				});

				it('the enable auto away field value should be true', () => {
					admin.accountsEnableAutoAway.should('be.checked');
				});

				it('it should show the idle timeout limit field', () => {
					admin.accountsidleTimeLimit.click();
					admin.accountsidleTimeLimit.should('be.visible');
				});

				it('the idle timeout limit field value should be 300', () => {
					admin.accountsidleTimeLimit.should('have.value', '300');
				});

				it('it should show the audio notifications select field', () => {
					admin.accountsAudioNotifications.scrollIntoView();
					admin.accountsAudioNotifications.should('be.visible');
				});

				it('the audio notifications field value should be mentions', () => {
					admin.accountsAudioNotifications.should('have.value', 'mentions');
				});

				it('it should show the desktop audio notifications select field', () => {
					admin.accountsDesktopNotifications.scrollIntoView();
					admin.accountsDesktopNotifications.should('be.visible');
				});

				it('the desktop audio notifications field value should be all', () => {
					admin.accountsDesktopNotifications.should('have.value', 'all');
				});

				it('it should show the mobile notifications select field', () => {
					admin.accountsMobileNotifications.scrollIntoView();
					admin.accountsMobileNotifications.should('be.visible');
				});

				it('the mobile notifications field value should be all', () => {
					admin.accountsMobileNotifications.should('have.value', 'all');
				});

				it('it should show the unread tray icon alert field', () => {
					admin.accountsUnreadAlert.parent().scrollIntoView();
					admin.accountsUnreadAlert.parent().should('be.visible');
				});

				it('the unread tray icon alert field value should be true', () => {
					admin.accountsUnreadAlert.should('be.checked');
				});

				it('it should show the use emojis field', () => {
					admin.accountsUseEmojis.parent().scrollIntoView();
					admin.accountsUseEmojis.parent().should('be.visible');
				});

				it('the use emojis field value should be true', () => {
					admin.accountsUseEmojis.should('be.checked');
				});

				it('it should show the convert ascii to emoji field', () => {
					admin.accountsConvertAsciiEmoji.parent().scrollIntoView();
					admin.accountsConvertAsciiEmoji.parent().should('be.visible');
				});

				it('the convert ascii to emoji field value should be true', () => {
					admin.accountsConvertAsciiEmoji.should('be.checked');
				});

				it('it should show the auto load images field', () => {
					admin.accountsAutoImageLoad.parent().scrollIntoView();
					admin.accountsAutoImageLoad.parent().should('be.visible');
				});

				it('the auto load images field value should be true', () => {
					admin.accountsAutoImageLoad.should('be.checked');
				});

				it('it should show the save mobile bandwidth field', () => {
					admin.accountsSaveMobileBandwidth.parent().scrollIntoView();
					admin.accountsSaveMobileBandwidth.parent().should('be.visible');
				});

				it('the save mobile bandwidth field value should be true', () => {
					admin.accountsSaveMobileBandwidth.should('be.checked');
				});

				it('it should show the collapse embedded media by default field', () => {
					admin.accountsCollapseMediaByDefault.parent().scrollIntoView();
					admin.accountsCollapseMediaByDefault.parent().should('be.visible');
				});

				it('the collapse embedded media by default field value should be false', () => {
					admin.accountsCollapseMediaByDefault.should('not.be.checked');
				});

				it('it should show the hide usernames field', () => {
					admin.accountsHideUsernames.parent().scrollIntoView();
					admin.accountsHideUsernames.parent().should('be.visible');
				});

				it('the hide usernames field value should be false', () => {
					admin.accountsHideUsernames.should('not.be.checked');
				});

				it('it should show the hide roles field', () => {
					admin.accountsHideRoles.parent().scrollIntoView();
					admin.accountsHideRoles.parent().should('be.visible');
				});

				it('the hide roles field value should be false', () => {
					admin.accountsHideRoles.should('not.be.checked');
				});

				it('it should show the hide right sidebar with click field', () => {
					admin.accountsHideFlexTab.parent().scrollIntoView();
					admin.accountsHideFlexTab.parent().should('be.visible');
				});

				it('the hide right sidebar with click field value should be false', () => {
					admin.accountsHideFlexTab.should('not.be.checked');
				});

				it('it should show the hide avatars field', () => {
					admin.accountsHideAvatars.parent().scrollIntoView();
					admin.accountsHideAvatars.parent().should('be.visible');
				});

				it('the hide avatars field value should be false', () => {
					admin.accountsHideAvatars.should('not.be.checked');
				});

				it('it should show the enter key behavior field', () => {
					admin.accountsSendOnEnter.scrollIntoView();
					admin.accountsSendOnEnter.should('be.visible');
				});

				it('the enter key behavior field value should be normal', () => {
					admin.accountsSendOnEnter.should('have.value', 'normal');
				});

				it('it should show the messagebox view mode field', () => {
					admin.accountsMessageViewMode.scrollIntoView();
					admin.accountsMessageViewMode.should('be.visible');
				});

				it('the view mode field value should be 0', () => {
					admin.accountsMessageViewMode.should('have.value', '0');
				});

				it('it should show the offline email notification field', () => {
					admin.accountsEmailNotificationMode.scrollIntoView();
					admin.accountsEmailNotificationMode.should('be.visible');
				});

				it('the offline email notification field value should be all', () => {
					admin.accountsEmailNotificationMode.should('have.value', 'mentions');
				});

				it('it should show the new room notification field', () => {
					admin.accountsNewRoomNotification.scrollIntoView();
					admin.accountsNewRoomNotification.should('be.visible');
				});

				it('the new room notification field value should be door', () => {
					admin.accountsNewRoomNotification.should('have.value', 'door');
				});

				it('it should show the new message notification field', () => {
					admin.accountsNewMessageNotification.scrollIntoView();
					admin.accountsNewMessageNotification.should('be.visible');
				});

				it('the new message notification field value should be chime', () => {
					admin.accountsNewMessageNotification.should('have.value', 'chime');
				});

				it('it should show the notification sound volume field', () => {
					admin.accountsNotificationsSoundVolume.scrollIntoView();
					admin.accountsNotificationsSoundVolume.should('be.visible');
				});

				it('the notification sound volume field value should be 100', () => {
					admin.accountsNotificationsSoundVolume.should('have.value', '100');
				});
			});
		});
	});
});
