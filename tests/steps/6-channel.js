/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

import {username} from '../test-data/user.js';
import {publicChannelName} from '../test-data/channel.js';
import {targetUser} from '../test-data/interactions.js';

describe('channel settings', ()=> {

	describe('channel info tab', ()=> {
		it('open the channel', ()=> {
			sideNav.openChannel(publicChannelName);
		});

		it('open the channel info tab', ()=> {
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
			//gives timeout errors
			var channelName = sideNav.getChannelFromList('NAME-EDITED-'+publicChannelName);
			channelName.getText().should.equal('NAME-EDITED-'+publicChannelName);
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

		it('click the edit description', ()=> {
			flexTab.editDescriptionBtn.waitForVisible();
			flexTab.editDescriptionBtn.click();
		});

		it('edit the description input', ()=> {
			flexTab.editDescriptionTextInput.waitForVisible();
			flexTab.editDescriptionTextInput.setValue('DESCRIPTION EDITED');
		});

		it('save the description', ()=> {
			flexTab.editNameSave.click();
		});

		it('should show the new description', ()=> {
			flexTab.thirdSetting.getText().should.equal('DESCRIPTION EDITED');
		});

		it('open the users tab', ()=> {
			browser.pause(7000);
			flexTab.membersTab.waitForVisible();
			flexTab.membersTab.click();

		});

		it('sets rocket cat as owner', ()=> {
			browser.pause(1000);
			flexTab.setUserOwner(targetUser);
		});

		it('should show the owner add message', ()=> {
			browser.pause(10000);
			mainContent.lastMessage.getText().should.equal(targetUser+' was set owner by '+username);
		});

		it('sets rocket cat as moderator', ()=> {
			browser.pause(1000);
			flexTab.setUserModerator(targetUser);
		});

		it('should show the moderator add message', ()=> {
			mainContent.lastMessage.getText().should.equal(targetUser+' was set moderator by '+username);
		});

		it('mute rocket cat', ()=> {
			browser.pause(6000);
			flexTab.muteUser(targetUser);
		});

		it('confirms the popup', ()=> {
			flexTab.confirmPopup();
		});

		it('close the user screen', ()=> {
			browser.pause(6000);
			flexTab.viewAllBtn.click();
		});
	});
});