import sideNav from '../pageobjects/side-nav.page';
import settings from '../pageobjects/settings.page';
import { checkIfUserIsValid } from '../../data/checks';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';

describe('[Settings]', () => {
	before(() => {
		checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
	});

	after(() => {
		sideNav.preferencesClose.click();
	});

	describe('[Settings View]', () => {
		before(() => {
			sideNav.sidebarMenu.click();
		});

		it('it should enter the settings view', () => {
			sideNav.settings.click();
		});

		describe('[General Settings]', () => {
			before(() => {
				settings.settingsSearch.type('general');
				settings.generalLink.click();
				settings.settingsSearch.clear();
			});

			describe('general:', () => {
				it('it should show site url field', () => {
					settings.generalSiteUrl.should('be.visible');
				});

				it('it should change site url field', () => {
					settings.generalSiteUrl.type('something');
				});

				it('it should show the reset button', () => {
					settings.generalSiteUrlReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					settings.generalSiteUrlReset.click();
				});

				it('it should that the site url field is different from the last input', () => {
					settings.generalSiteUrl.should('not.contain', 'something');
				});

				it('it should show site name field', () => {
					settings.generalSiteName.should('be.visible');
				});

				it('it should change site name field', () => {
					settings.generalSiteName.type('something');
				});

				it('it should show the reset button', () => {
					settings.generalSiteNameReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					settings.generalSiteNameReset.click();
				});

				it('it should be that the name field is different from the last input', () => {
					settings.generalSiteName.should('not.contain', 'something');
				});

				it('it should show language field', () => {
					settings.generalLanguage.should('be.visible');
				});

				it('it should change the language ', () => {
					settings.generalLanguage.select('pt');
				});

				it('it should show the reset button', () => {
					settings.generalLanguageReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					settings.generalLanguageReset.click();
				});

				it('it should show invalid self signed certs toggle', () => {
					settings.generalSelfSignedCerts.parent().should('be.visible');
				});

				it('it should change the invalid self signed certs toggle', () => {
					settings.generalSelfSignedCerts.parent().click();
				});

				it('it should show the reset button', () => {
					settings.generalSelfSignedCertsReset.should('be.visible');
				});

				it('it should click the reset button', () => {
					settings.generalSelfSignedCertsReset.click();
				});

				it('it should show favorite rooms checkboxes', () => {
					settings.generalFavoriteRoom.parent().should('be.visible');
				});

				it('it should change the favorite rooms toggle', () => {
					settings.generalFavoriteRoom.parent().click();
				});

				it('it should show the reset button', () => {
					settings.generalFavoriteRoomReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					settings.generalFavoriteRoomReset.click();
				});

				it('it should show open first channel field', () => {
					settings.generalOpenFirstChannel.should('be.visible');
				});

				it('it should change open first channel field', () => {
					settings.generalOpenFirstChannel.type('something');
				});

				it('it should show the reset button', () => {
					settings.generalOpenFirstChannelReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					settings.generalOpenFirstChannelReset.click();
				});

				it('it should show cdn prefix field', () => {
					settings.generalCdnPrefix.should('be.visible');
				});

				it('it should change site url field', () => {
					settings.generalCdnPrefix.type('something');
				});

				it('it should show the reset button', () => {
					settings.generalCdnPrefixReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					settings.generalCdnPrefixReset.click();
				});

				it('it should show the force SSL toggle', () => {
					settings.generalForceSSL.parent().should('be.visible');
				});

				it('it should change the force ssl toggle', () => {
					settings.generalForceSSL.parent().click();
				});

				it('it should show the reset button', () => {
					settings.generalForceSSLReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					settings.generalForceSSLReset.click();
				});

				it('it should show google tag id field', () => {
					settings.generalGoogleTagId.should('be.visible');
				});

				it('it should change google tag id field', () => {
					settings.generalGoogleTagId.type('something');
				});

				it('it should show the reset button', () => {
					settings.generalGoogleTagIdReset.scrollIntoView().should('be.visible');
				});

				it('it should click the reset button', () => {
					settings.generalGoogleTagIdReset.click();
				});

				it.skip('it should show bugsnag key field', () => {
					settings.generalBugsnagKey.should('be.visible');
				});

				it.skip('it should change bugsnag key id field', () => {
					settings.generalBugsnagKey.type('something');
				});

				it.skip('it should show the reset button', () => {
					settings.generalBugsnagKeyReset.scrollIntoView().should('be.visible');
				});

				it.skip('it should click the reset button', () => {
					settings.generalBugsnagKeyReset.click();
				});
			});

			describe('iframe:', () => {
				before(() => {
					settings.generalSectionIframeIntegration.find('[aria-expanded="false"]').click();
					settings.generalIframeSend.parent().scrollIntoView();
				});

				it('it should show iframe send toggle', () => {
					settings.generalIframeSend.parent().should('be.visible');
				});

				it('it should show send origin field', () => {
					settings.generalIframeSendTargetOrigin.should('be.visible');
				});

				it('it should show iframe send toggle', () => {
					settings.generalIframeRecieve.parent().should('be.visible');
				});

				it('it should show send origin field', () => {
					settings.generalIframeRecieveOrigin.should('be.visible');
				});
			});

			describe('notifications:', () => {
				before(() => {
					settings.generalSectionNotifications.find('[aria-expanded="false"]').click();
					settings.generalNotificationsMaxRoomMembers.scrollIntoView();
				});

				it('it should show the max room members field', () => {
					settings.generalNotificationsMaxRoomMembers.should('be.visible');
				});
			});

			describe('rest api:', () => {
				before(() => {
					settings.generalSectionRestApi.find('[aria-expanded="false"]').click();
					settings.generalRestApiUserLimit.scrollIntoView();
				});

				it('it should show the API user add limit field', () => {
					settings.generalRestApiUserLimit.should('be.visible');
				});
			});

			describe('reporting:', () => {
				before(() => {
					settings.generalSectionReporting.find('[aria-expanded="false"]').click();
					settings.generalReporting.parent().scrollIntoView();
				});

				it('it should show the report to rocket.chat toggle', () => {
					settings.generalReporting.parent().should('be.visible');
				});
			});

			describe('stream cast:', () => {
				before(() => {
					settings.generalSectionStreamCast.find('[aria-expanded="false"]').click();
					settings.generalStreamCastAdress.scrollIntoView();
				});

				it('it should show the stream cast adress field', () => {
					settings.generalStreamCastAdress.should('be.visible');
				});
			});

			describe('utf8:', () => {
				before(() => {
					settings.generalSectionUTF8.find('[aria-expanded="false"]').click();
					settings.generalUTF8Regex.scrollIntoView();
				});

				it('it should show the utf8 regex field', () => {
					settings.generalUTF8Regex.should('be.visible');
				});

				it('it should show the utf8 names slug checkboxes', () => {
					settings.generalUTF8NamesSlug.parent().should('be.visible');
				});
			});
		});

		describe('[Accounts]', () => {
			before(() => {
				settings.settingsSearch.type('accounts');
				settings.accountsLink.click();
				settings.settingsSearch.clear();
			});

			describe('default user preferences', () => {
				before(() => {
					settings.accountsSectionDefaultUserPreferences.find('[aria-expanded="false"]').click();
				});

				it('it should show the enable auto away field', () => {
					settings.accountsEnableAutoAway.parent().scrollIntoView();
					settings.accountsEnableAutoAway.parent().should('be.visible');
				});

				it('the enable auto away field value should be true', () => {
					settings.accountsEnableAutoAway.should('be.checked');
				});

				it('it should show the idle timeout limit field', () => {
					settings.accountsidleTimeLimit.click();
					settings.accountsidleTimeLimit.should('be.visible');
				});

				it('the idle timeout limit field value should be 300', () => {
					settings.accountsidleTimeLimit.should('have.value', '300');
				});

				it('it should show the notifications durations field', () => {
					settings.accountsNotificationDuration.click();
					settings.accountsNotificationDuration.should('be.visible');
				});

				it('the notification duration field value should be 0', () => {
					settings.accountsNotificationDuration.should('have.value', '0');
				});

				it('it should show the audio notifications select field', () => {
					settings.accountsAudioNotifications.scrollIntoView();
					settings.accountsAudioNotifications.should('be.visible');
				});

				it('the audio notifications field value should be mentions', () => {
					settings.accountsAudioNotifications.should('have.value', 'mentions');
				});

				it('it should show the desktop audio notifications select field', () => {
					settings.accountsDesktopNotifications.scrollIntoView();
					settings.accountsDesktopNotifications.should('be.visible');
				});

				it('the desktop audio notifications field value should be all', () => {
					settings.accountsDesktopNotifications.should('have.value', 'all');
				});

				it('it should show the mobile notifications select field', () => {
					settings.accountsMobileNotifications.scrollIntoView();
					settings.accountsMobileNotifications.should('be.visible');
				});

				it('the mobile notifications field value should be all', () => {
					settings.accountsMobileNotifications.should('have.value', 'all');
				});

				it('it should show the unread tray icon alert field', () => {
					settings.accountsUnreadAlert.parent().scrollIntoView();
					settings.accountsUnreadAlert.parent().should('be.visible');
				});

				it('the unread tray icon alert field value should be true', () => {
					settings.accountsUnreadAlert.should('be.checked');
				});

				it('it should show the use emojis field', () => {
					settings.accountsUseEmojis.parent().scrollIntoView();
					settings.accountsUseEmojis.parent().should('be.visible');
				});

				it('the use emojis field value should be true', () => {
					settings.accountsUseEmojis.should('be.checked');
				});

				it('it should show the convert ascii to emoji field', () => {
					settings.accountsConvertAsciiEmoji.parent().scrollIntoView();
					settings.accountsConvertAsciiEmoji.parent().should('be.visible');
				});

				it('the convert ascii to emoji field value should be true', () => {
					settings.accountsConvertAsciiEmoji.should('be.checked');
				});

				it('it should show the auto load images field', () => {
					settings.accountsAutoImageLoad.parent().scrollIntoView();
					settings.accountsAutoImageLoad.parent().should('be.visible');
				});

				it('the auto load images field value should be true', () => {
					settings.accountsAutoImageLoad.should('be.checked');
				});

				it('it should show the save mobile bandwidth field', () => {
					settings.accountsSaveMobileBandwidth.parent().scrollIntoView();
					settings.accountsSaveMobileBandwidth.parent().should('be.visible');
				});

				it('the save mobile bandwidth field value should be true', () => {
					settings.accountsSaveMobileBandwidth.should('be.checked');
				});

				it('it should show the collapse embedded media by default field', () => {
					settings.accountsCollapseMediaByDefault.parent().scrollIntoView();
					settings.accountsCollapseMediaByDefault.parent().should('be.visible');
				});

				it('the collapse embedded media by default field value should be false', () => {
					settings.accountsCollapseMediaByDefault.should('not.be.checked');
				});

				it('it should show the hide usernames field', () => {
					settings.accountsHideUsernames.parent().scrollIntoView();
					settings.accountsHideUsernames.parent().should('be.visible');
				});

				it('the hide usernames field value should be false', () => {
					settings.accountsHideUsernames.should('not.be.checked');
				});

				it('it should show the hide roles field', () => {
					settings.accountsHideRoles.parent().scrollIntoView();
					settings.accountsHideRoles.parent().should('be.visible');
				});

				it('the hide roles field value should be false', () => {
					settings.accountsHideRoles.should('not.be.checked');
				});

				it('it should show the hide right sidebar with click field', () => {
					settings.accountsHideFlexTab.parent().scrollIntoView();
					settings.accountsHideFlexTab.parent().should('be.visible');
				});

				it('the hide right sidebar with click field value should be false', () => {
					settings.accountsHideFlexTab.should('not.be.checked');
				});

				it('it should show the hide avatars field', () => {
					settings.accountsHideAvatars.parent().scrollIntoView();
					settings.accountsHideAvatars.parent().should('be.visible');
				});

				it('the hide avatars field value should be false', () => {
					settings.accountsHideAvatars.should('not.be.checked');
				});

				it('it should show the enter key behavior field', () => {
					settings.accountsSendOnEnter.scrollIntoView();
					settings.accountsSendOnEnter.should('be.visible');
				});

				it('the enter key behavior field value should be normal', () => {
					settings.accountsSendOnEnter.should('have.value', 'normal');
				});

				it('it should show the messagebox view mode field', () => {
					settings.accountsMessageViewMode.scrollIntoView();
					settings.accountsMessageViewMode.should('be.visible');
				});

				it('the view mode field value should be 0', () => {
					settings.accountsMessageViewMode.should('have.value', '0');
				});

				it('it should show the offline email notification field', () => {
					settings.accountsEmailNotificationMode.scrollIntoView();
					settings.accountsEmailNotificationMode.should('be.visible');
				});

				it('the offline email notification field value should be all', () => {
					settings.accountsEmailNotificationMode.should('have.value', 'mentions');
				});
				it('it should show the new room notification field', () => {
					settings.accountsNewRoomNotification.scrollIntoView();
					settings.accountsNewRoomNotification.should('be.visible');
				});

				it('the new room notification field value should be door', () => {
					settings.accountsNewRoomNotification.should('have.value', 'door');
				});

				it('it should show the new message notification field', () => {
					settings.accountsNewMessageNotification.scrollIntoView();
					settings.accountsNewMessageNotification.should('be.visible');
				});

				it('the new message notification field value should be chime', () => {
					settings.accountsNewMessageNotification.should('have.value', 'chime');
				});

				it('it should show the notification sound volume field', () => {
					settings.accountsNotificationsSoundVolume.scrollIntoView();
					settings.accountsNotificationsSoundVolume.should('be.visible');
				});

				it('the notification sound volume field value should be 100', () => {
					settings.accountsNotificationsSoundVolume.should('have.value', '100');
				});
			});
		});
	});
});
