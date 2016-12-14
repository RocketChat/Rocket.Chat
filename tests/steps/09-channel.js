/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

import {username, email, password} from '../test-data/user.js';
import {checkIfUserIsValid, publicChannelCreated, setPublicChannelCreated} from '../test-data/checks';
import {publicChannelName} from '../test-data/channel.js';
import {targetUser} from '../test-data/interactions.js';

describe('channel usage', ()=> {
	before(() => {
		checkIfUserIsValid(username, email, password);
		if (!publicChannelCreated) {
			sideNav.createChannel(publicChannelName, false, false);
			setPublicChannelCreated(true);
			console.log('	public channel not found, creating one...');
		}
		sideNav.openChannel(publicChannelName);
	});

	describe('Adding a user to the room', () => {
		before(()=> {
			flexTab.membersTab.waitForVisible();
			flexTab.membersTab.click();
		});

		after(()=> {
			browser.pause(500);
			flexTab.membersTab.waitForVisible();
			flexTab.membersTab.click();
		});

		it('add people to the room', () => {
			flexTab.addPeopleToChannel(targetUser);
		});

	});

	describe('Channel settings', ()=> {
		describe('Channel name edit', ()=> {
			before(()=> {
				flexTab.channelTab.waitForVisible();
				flexTab.channelTab.click();
			});

			after(()=> {
				flexTab.dismissToast();
				browser.pause(300);
				flexTab.channelTab.waitForVisible();
				flexTab.channelTab.click();
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
				flexTab.editNameTextInput.setValue('NAME-EDITED-'+publicChannelName);
			});

			it('save the name', ()=> {
				flexTab.editNameSave.click();

			});

			it('should show the new name', ()=> {
				browser.pause(500);
				var channelName = sideNav.getChannelFromList('NAME-EDITED-'+publicChannelName);
				channelName.getText().should.equal('NAME-EDITED-'+publicChannelName);
			});
		});

		describe('Channel topic edit', ()=> {
			before(()=> {
				flexTab.channelTab.waitForVisible();
				flexTab.channelTab.click();
			});

			after(()=> {
				flexTab.dismissToast();
				browser.pause(300);
				flexTab.channelTab.waitForVisible();
				flexTab.channelTab.click();
			});

			it('click the edit topic', ()=> {
				browser.pause(500);
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

		describe('Channel description edit', ()=> {
			before(()=> {
				flexTab.channelTab.waitForVisible();
				flexTab.channelTab.click();
			});

			after(()=> {
				flexTab.dismissToast();
				browser.pause(300);
				flexTab.channelTab.waitForVisible();
				flexTab.channelTab.click();
			});

			it('click the edit description', ()=> {
				browser.pause(500);
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
				flexTab.thirdSetting.getText().should.equal('DESCRIPTION EDITED');
			});
		});
	});

	describe('Members tab usage', () => {
		describe('Owner added', () => {
			before(()=> {
				flexTab.membersTab.waitForVisible();
				flexTab.membersTab.click();
			});

			after(()=> {
				flexTab.membersTab.waitForVisible();
				flexTab.membersTab.click();
			});

			it('sets rocket cat as owner', ()=> {
				flexTab.setUserOwner(targetUser);
			});

			it('dismiss the toast', ()=> {
				flexTab.dismissToast();
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
				flexTab.membersTab.waitForVisible();
				flexTab.membersTab.click();
			});

			after(()=> {
				flexTab.membersTab.waitForVisible();
				flexTab.membersTab.click();
			});

			it('sets rocket cat as moderator', ()=> {
				browser.pause(1000);
				flexTab.setUserModerator(targetUser);
			});

			it('the last message should be a subscription role added', ()=> {
				mainContent.lastMessageRoleAdded.isVisible().should.be.true;
			});

			it('should show the target username in moderator add message', ()=> {
				mainContent.lastMessage.getText().should.have.string(targetUser);
			});
		});

		describe('User muted', () => {
			before(()=> {
				flexTab.membersTab.waitForVisible();
				flexTab.membersTab.click();
			});

			after(()=> {
				flexTab.membersTab.waitForVisible();
				flexTab.membersTab.click();
			});

			it('mute rocket cat', ()=> {
				browser.pause(5000);
				flexTab.muteUser(targetUser);
			});

			it('confirms the popup', ()=> {
				flexTab.confirmPopup();
			});
		});
	});
});