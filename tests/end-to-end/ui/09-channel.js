/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import flexTab from '../../pageobjects/flex-tab.page';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import Global from '../../pageobjects/global';

import {username, email, password} from '../../data/user.js';
import {checkIfUserIsValid, publicChannelCreated, setPublicChannelCreated} from '../../data/checks';
import {publicChannelName} from '../../data/channel.js';
import {targetUser} from '../../data/interactions.js';

describe('channel', ()=> {
	before(() => {
		checkIfUserIsValid(username, email, password);
		if (!publicChannelCreated) {
			sideNav.createChannel(publicChannelName, false, false);
			setPublicChannelCreated(true);
			console.log('public channel not found, creating one...');
		}
	});
	describe('channel search', ()=> {
		describe('searching with spotlightSearch', () => {
			describe('rocket.cat', () => {
				beforeEach(() => {
					sideNav.getChannelFromSpotlight('rocket.cat').waitForVisible(5000);
				});

				afterEach(() => {
					sideNav.spotlightSearch.setValue('');
				});

				it('should search rocket cat', () => {
					sideNav.getChannelFromSpotlight('rocket.cat').isVisible().should.be.true;
				});

				it('should start a direct message with rocket.cat', () => {
					sideNav.searchChannel('rocket.cat');
					mainContent.channelTitle.getText().should.equal('rocket.cat');
				});
			});

			describe('general', () => {
				beforeEach(() => {
					sideNav.getChannelFromSpotlight('general').waitForVisible(5000);
				});

				afterEach(() => {
					sideNav.spotlightSearch.setValue('');
				});

				it('should search general', () => {
					sideNav.getChannelFromSpotlight('general').isVisible().should.be.true;
				});

				it('should go to general', () => {
					sideNav.searchChannel('general');
					mainContent.channelTitle.getText().should.equal('general');
				});
			});

			describe('user created channel', () => {
				beforeEach(() => {
					sideNav.getChannelFromSpotlight(publicChannelName).waitForVisible(5000);
				});

				afterEach(() => {
					sideNav.spotlightSearch.setValue('');
				});

				it('should search the user created channel', () => {
					sideNav.getChannelFromSpotlight(publicChannelName).isVisible().should.be.true;
				});

				it('should go to the user created channel', () => {
					sideNav.searchChannel(publicChannelName);
					mainContent.channelTitle.getText().should.equal(publicChannelName);
				});
			});
		});

		describe('searching with sideNav channel list', () => {
			before(() => {
				mainContent.messageInput.click();
			});
			describe('rocket.cat', () => {
				it('should show the rocket cat in the direct messages list', () => {
					sideNav.getChannelFromList('rocket.cat').isVisible().should.be.true;
				});

				it('should go to the rocket cat direct message', () => {
					sideNav.openChannel('rocket.cat');
				});
			});

			describe('general', () => {
				it('should show the general in the channel list', () => {
					sideNav.getChannelFromList('general').isVisible().should.be.true;
				});

				it('should go to the general channel', () => {
					sideNav.openChannel('general');
				});
			});
			describe('user created channel', () => {
				it('should show the user created channel in the channel list', () => {
					sideNav.getChannelFromList(publicChannelName).isVisible().should.be.true;
				});

				it('should go to the user created channel', () => {
					sideNav.openChannel(publicChannelName);
				});
			});
		});
	});

	describe('channel usage', ()=> {
		before(() => {
			sideNav.openChannel(publicChannelName);
		});

		describe('Adding a user to the room', () => {
			before(()=> {
				if (Global.toastAlert.isVisible()) {
					Global.dismissToast();
					Global.toastAlert.waitForVisible(5000, true);
				}
				flexTab.operateFlexTab('members', true);
			});

			after(()=> {
				if (Global.toastAlert.isVisible()) {
					Global.dismissToast();
					Global.toastAlert.waitForVisible(5000, true);
				}
				flexTab.operateFlexTab('members', false);

			});

			it('add people to the room', () => {
				flexTab.addPeopleToChannel(targetUser);
			});

		});

		describe('Channel settings', ()=> {
			describe('Channel name edit', ()=> {
				before(()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
					flexTab.operateFlexTab('info', true);

				});

				after(()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
					flexTab.operateFlexTab('info', false);
				});

				it('should show the old name', ()=> {
					flexTab.firstSetting.waitForVisible();
					flexTab.firstSetting.getText().should.equal(publicChannelName);
				});

				it('click the edit name', ()=> {
					flexTab.editNameBtn.waitForVisible();
					flexTab.editNameBtn.click();
				});

				it('edit the name input', ()=> {
					flexTab.editNameTextInput.waitForVisible();
					flexTab.editNameTextInput.setValue(`NAME-EDITED-${ publicChannelName }`);
				});

				it('save the name', ()=> {
					flexTab.editNameSave.click();
				});

				it('should show the new name', ()=> {
					const channelName = sideNav.getChannelFromList(`NAME-EDITED-${ publicChannelName }`);
					channelName.getText().should.equal(`NAME-EDITED-${ publicChannelName }`);
				});
			});

			describe('Channel topic edit', ()=> {
				before(()=> {
					flexTab.operateFlexTab('info', true);
				});

				after(()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
					flexTab.operateFlexTab('info', false);
				});

				it('click the edit topic', ()=> {
					flexTab.editTopicBtn.waitForVisible(5000);
					flexTab.editTopicBtn.click();
				});

				it('edit the topic input', ()=> {
					flexTab.editTopicTextInput.waitForVisible(5000);
					flexTab.editTopicTextInput.setValue('TOPIC EDITED');
				});

				it('save the topic', ()=> {
					flexTab.editNameSave.click();
				});

				it('should show the new topic', ()=> {
					flexTab.secondSetting.getText().should.equal('TOPIC EDITED');
				});
			});

			describe('Channel announcement edit', ()=> {
				before(()=> {
					flexTab.operateFlexTab('info', true);
				});

				after(()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
					flexTab.operateFlexTab('info', false);
				});

				it('click the edit announcement', ()=> {
					flexTab.editAnnouncementBtn.waitForVisible(5000);
					flexTab.editAnnouncementBtn.click();
				});

				it('edit the announcement input', ()=> {
					flexTab.editAnnouncementTextInput.waitForVisible(5000);
					flexTab.editAnnouncementTextInput.setValue('ANNOUNCEMENT EDITED');
				});

				it('save the announcement', ()=> {
					flexTab.editNameSave.click();
				});

				it('should show the new announcement', ()=> {
					flexTab.thirdSetting.getText().should.equal('ANNOUNCEMENT EDITED');
				});
			});

			describe('Channel description edit', ()=> {
				before(()=> {
					flexTab.operateFlexTab('info', true);
				});

				after(()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
					flexTab.operateFlexTab('info', false);
				});

				it('click the edit description', ()=> {
					flexTab.editDescriptionBtn.waitForVisible();
					flexTab.editDescriptionBtn.click();
				});

				it('edit the description input', ()=> {
					flexTab.editDescriptionTextInput.waitForVisible(5000);
					flexTab.editDescriptionTextInput.setValue('DESCRIPTION EDITED');
				});

				it('save the description', ()=> {
					flexTab.editNameSave.click();
				});

				it('should show the new description', ()=> {
					flexTab.fourthSetting.getText().should.equal('DESCRIPTION EDITED');
				});
			});
		});

		describe('Members tab usage', () => {
			describe('User muted', () => {
				before(()=> {
					flexTab.operateFlexTab('members', true);
				});

				after(()=> {
					flexTab.operateFlexTab('members', false);
				});

				it('mute rocket cat', ()=> {
					flexTab.muteUser(targetUser);
				});
			});

			describe('Owner added', () => {
				before(()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
					flexTab.operateFlexTab('members', true);
				});

				after(()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
					flexTab.operateFlexTab('members', false);
				});

				it('sets rocket cat as owner', ()=> {
					flexTab.setUserOwner(targetUser);
				});

				it('dismiss the toast', ()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
				});

				it('the last message should be a subscription role added', ()=> {
					mainContent.lastMessageRoleAdded.isVisible().should.be.true;
				});

				it('should show the target username in owner add message', ()=> {
					mainContent.lastMessage.getText().should.have.string(targetUser);
				});
			});

			describe('Moderator added', () => {
				before(()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
					flexTab.operateFlexTab('members', true);

				});

				after(()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
					flexTab.operateFlexTab('members', false);
				});

				it('sets rocket cat as moderator', ()=> {
					flexTab.setUserModerator(targetUser);
				});

				it('dismiss the toast', ()=> {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
						Global.toastAlert.waitForVisible(5000, true);
					}
				});

				it('the last message should be a subscription role added', ()=> {
					mainContent.lastMessageRoleAdded.isVisible().should.be.true;
				});

				it('should show the target username in moderator add message', ()=> {
					mainContent.lastMessage.getText().should.have.string(targetUser);
				});
			});

			describe('channel quit and enter', () => {
				it('leave the channel', () => {
					const channel = sideNav.getChannelFromList(`NAME-EDITED-${ publicChannelName }`);
					channel.click();
					channel.moveToObject();
					sideNav.channelLeave.waitForVisible(5000);
					sideNav.channelLeave.click();
					Global.sweetAlert.waitForVisible(5000);
				});

				it('should show the sweet alert popup', () => {
					Global.sweetAlert.waitForVisible(5000);
					Global.sweetAlert.isVisible().should.be.true;
					Global.sweetAlertConfirm.isVisible().should.be.true;
				});

				it('should close the popup', () => {
					Global.confirmPopup();
				});

				it('should not show the channel on the list', () => {
					sideNav.getChannelFromList(`NAME-EDITED-${ publicChannelName }`).waitForVisible(5000, true);
					sideNav.getChannelFromList(`NAME-EDITED-${ publicChannelName }`).isVisible().should.be.false;
				});

				it('should search and enter the channel with the spotlight', () => {
					sideNav.searchChannel(`NAME-EDITED-${ publicChannelName }`);
					mainContent.joinChannelBtn.waitForVisible(5000);
					mainContent.joinChannelBtn.click();

				});

				it('should show the channel on the list', () => {
					sideNav.getChannelFromList(`NAME-EDITED-${ publicChannelName }`).waitForVisible(10000);
					sideNav.getChannelFromList(`NAME-EDITED-${ publicChannelName }`).isVisible().should.be.true;
				});
			});
		});
	});
});
