import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import Global from '../pageobjects/global';
import { username, email, password } from '../../data/user.js';
import { checkIfUserIsValid, publicChannelCreated, setPublicChannelCreated } from '../../data/checks';
import { publicChannelName } from '../../data/channel.js';
import { targetUser } from '../../data/interactions.js';

describe('[Channel]', () => {
	before(() => {
		checkIfUserIsValid(username, email, password);
		if (!publicChannelCreated) {
			sideNav.createChannel(publicChannelName, false, false);
			setPublicChannelCreated(true);
			console.log('public channel not found, creating one...');
		}
		sideNav.openChannel('general');
	});
	describe('[Search]', () => {
		describe('[SpotlightSearch]', () => {
			describe('rocket.cat:', () => {
				it('it should search rocket cat', () => {
					sideNav.spotlightSearchIcon.click();
					sideNav.searchChannel('rocket.cat');
				});

				it('it should start a direct message with rocket.cat', () => {
					mainContent.channelTitle.should('contain', 'rocket.cat');
				});
			});

			describe('general:', () => {
				it('it should search general', () => {
					sideNav.spotlightSearchIcon.click();
					sideNav.searchChannel('general');
				});

				it('it should go to general', () => {
					mainContent.channelTitle.should('contain', 'general');
				});
			});

			describe('user created channel:', () => {
				it('it should search the user created channel', () => {
					sideNav.spotlightSearchIcon.click();
					sideNav.searchChannel(publicChannelName);
				});

				it('it should go to the user created channel', () => {
					mainContent.channelTitle.should('contain', publicChannelName);
				});
			});
		});

		describe('[SideNav Channel List]', () => {
			before(() => {
				mainContent.messageInput.click();
			});
			describe('rocket.cat:', () => {
				it('it should show the rocket cat in the direct messages list', () => {
					sideNav.getChannelFromList('rocket.cat').scrollIntoView().should('be.visible');
				});

				it('it should go to the rocket cat direct message', () => {
					sideNav.openChannel('rocket.cat');
				});
			});

			describe('general:', () => {
				it('it should show the general in the channel list', () => {
					sideNav.getChannelFromList('general').scrollIntoView().should('be.visible');
				});

				it('it should go to the general channel', () => {
					sideNav.openChannel('general');
				});
			});

			describe('user created channel:', () => {
				it('it should show the user created channel in the channel list', () => {
					sideNav.getChannelFromList(publicChannelName).scrollIntoView().should('be.visible');
				});

				it('it should go to the user created channel', () => {
					sideNav.openChannel(publicChannelName);
				});
			});
		});
	});

	describe.skip('[Usage]', () => {
		before(() => {
			sideNav.openChannel(publicChannelName);
		});

		describe('Adding a user to the room:', () => {
			before(() => {
				if (Global.toastAlert.isVisible()) {
					Global.dismissToast();
				}
				flexTab.operateFlexTab('members', true);
			});

			after(() => {
				if (Global.toastAlert.isVisible()) {
					Global.dismissToast();
				}
				flexTab.operateFlexTab('members', false);
			});

			it('it should add people to the room', () => {
				flexTab.addPeopleToChannel(targetUser);
			});
		});

		describe('Channel settings:', () => {
			describe('Channel name edit', () => {
				before(() => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
					flexTab.operateFlexTab('info', true);
				});

				after(() => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
					flexTab.operateFlexTab('info', false);
				});

				it('it should show the old name', () => {
					flexTab.firstSetting.getText().should.equal(publicChannelName);
				});

				it('it should click the edit name', () => {
					flexTab.editNameBtn.click();
				});

				it('it should edit the name input', () => {
					flexTab.editNameTextInput.type(`NAME-EDITED-${publicChannelName}`);
				});

				it('it should save the name', () => {
					flexTab.editNameSave.click();
				});

				it('it should show the new name', () => {
					const channelName = sideNav.getChannelFromList(`NAME-EDITED-${publicChannelName}`);
					channelName.getText().should.equal(`NAME-EDITED-${publicChannelName}`);
				});
			});

			describe('Channel topic edit', () => {
				before(() => {
					flexTab.operateFlexTab('info', true);
				});

				after(() => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
					flexTab.operateFlexTab('info', false);
				});

				it('it should click the edit topic', () => {
					flexTab.editTopicBtn.click();
				});

				it('it should edit the topic input', () => {
					flexTab.editTopicTextInput.type('TOPIC EDITED');
				});

				it('it should save the topic', () => {
					flexTab.editNameSave.click();
				});

				it('it should show the new topic', () => {
					flexTab.secondSetting.getText().should.equal('TOPIC EDITED');
				});
			});

			describe('Channel announcement edit', () => {
				before(() => {
					flexTab.operateFlexTab('info', true);
				});

				after(() => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
					flexTab.operateFlexTab('info', false);
				});

				it('it should click the edit announcement', () => {
					flexTab.editAnnouncementBtn.click();
				});

				it('it should edit the announcement input', () => {
					flexTab.editAnnouncementTextInput.type('ANNOUNCEMENT EDITED');
				});

				it('it should save the announcement', () => {
					flexTab.editNameSave.click();
				});

				it('it should show the new announcement', () => {
					flexTab.thirdSetting.getText().should.equal('ANNOUNCEMENT EDITED');
				});
			});

			describe('Channel description edit', () => {
				before(() => {
					flexTab.operateFlexTab('info', true);
				});

				after(() => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
					flexTab.operateFlexTab('info', false);
				});

				it('it should click the edit description', () => {
					flexTab.editDescriptionBtn.click();
				});

				it('it should edit the description input', () => {
					flexTab.editDescriptionTextInput.type('DESCRIPTION EDITED');
				});

				it('it should save the description', () => {
					flexTab.editNameSave.click();
				});

				it('it should show the new description', () => {
					flexTab.fourthSetting.getText().should.equal('DESCRIPTION EDITED');
				});
			});
		});

		describe('Members tab usage:', () => {
			describe('User muted', () => {
				before(() => {
					flexTab.operateFlexTab('members', true);
				});

				after(() => {
					flexTab.operateFlexTab('members', false);
				});

				it('it should mute rocket cat', () => {
					flexTab.muteUser(targetUser);
				});
			});

			describe('Owner added', () => {
				before(() => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
					flexTab.operateFlexTab('members', true);
				});

				after(() => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
					flexTab.operateFlexTab('members', false);
				});

				it('it should set rocket cat as owner', () => {
					flexTab.setUserOwner(targetUser);
				});

				it('it should dismiss the toast', () => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
				});

				it('it should the last message should be a subscription role added', () => {
					mainContent.lastMessageRoleAdded.should('be.visible');
				});

				it('it should show the target username in owner add message', () => {
					mainContent.lastMessage.getText().should.have.string(targetUser);
				});
			});

			describe('Moderator added', () => {
				before(() => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
					flexTab.operateFlexTab('members', true);
				});

				after(() => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
					flexTab.operateFlexTab('members', false);
				});

				it('it should set rocket cat as moderator', () => {
					flexTab.setUserModerator(targetUser);
				});

				it('it should dismiss the toast', () => {
					if (Global.toastAlert.isVisible()) {
						Global.dismissToast();
					}
				});

				it('it should be that the last message is a subscription role added', () => {
					mainContent.lastMessageRoleAdded.should('be.visible');
				});

				it('it should show the target username in moderator add message', () => {
					mainContent.lastMessage.getText().should.have.string(targetUser);
				});
			});

			// no channel quit at the moment
			describe.skip('channel quit and enter', () => {
				it('it should leave the channel', () => {
					const channel = sideNav.getChannelFromList(`NAME-EDITED-${publicChannelName}`);
					channel.click();
					channel.moveToObject();
					sideNav.channelLeave.click();
				});

				it('it should show the modal alert popup', () => {
					Global.modal.should('be.visible');
					Global.modalConfirm.should('be.visible');
				});

				it('it should close the popup', () => {
					Global.confirmPopup();
				});

				it('it should not show the channel on the list', () => {
					sideNav.getChannelFromList(`NAME-EDITED-${publicChannelName}`).should('not.exist');
				});

				it('it should search and enter the channel with the spotlight', () => {
					sideNav.searchChannel(`NAME-EDITED-${publicChannelName}`);
					mainContent.joinChannelBtn.click();
				});

				it('it should show the channel on the list', () => {
					sideNav.getChannelFromList(`NAME-EDITED-${publicChannelName}`).should('be.visible');
				});
			});
		});
	});
});
