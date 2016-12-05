/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import loginPage from '../pageobjects/login.page';
import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

//test data imports
import {username, email, password, adminUsername, adminEmail, adminPassword} from '../test-data/user.js';
import {publicChannelName, privateChannelName} from '../test-data/channel.js';
import {targetUser, imgURL} from '../test-data/interactions.js';
import {checkIfUserIsValid, publicChannelCreated, privateChannelCreated, directMessageCreated, setPublicChannelCreated, setPrivateChannelCreated, setDirectMessageCreated} from '../test-data/checks';
import {username, email, password} from '../test-data/user.js';

//Test data
const message = 'message from '+username;

function messagingTest() {
	describe('Normal message', ()=> {
		it('send a message', () => {
			mainContent.sendMessage(message);
		});
		it('should show the last message', () => {
			mainContent.lastMessage.isVisible().should.be.true;
		});

		it('the last message should be from the loged user', () => {
			mainContent.lastMessageUser.getText().should.equal(username);
		});

		it('should not show the Admin tag', () => {
			mainContent.lastMessageUserTag.isVisible().should.be.false;
		});
	});

	describe('fileUpload', ()=> {
		it('send a attachment', () => {
			mainContent.fileUpload(imgURL);
		});

		it('should show the confirm button', () => {
			mainContent.popupFileConfirmBtn.isVisible().should.be.true;
		});

		it('should show the cancel button', () => {
			mainContent.popupFileCancelBtn.isVisible().should.be.true;
		});

		it('should show the file preview', () => {
			mainContent.popupFilePreview.isVisible().should.be.true;
		});

		it('should show the confirm button', () => {
			mainContent.popupFileConfirmBtn.isVisible().should.be.true;
		});

		it('should show the file title', () => {
			mainContent.popupFileTitle.isVisible().should.be.true;
		});

		it('click the confirm', () => {
			mainContent.popupFileConfirmBtn.click();
		});
	});
}

describe('Messaging in different channels', () => {
	before(()=>{
		checkIfUserIsValid(username, email, password);
		sideNav.getChannelFromList('general').waitForExist(5000);
		sideNav.openChannel('general');
	});

	describe('Messaging in GENERAL channel', () => {
		before(()=>{
			sideNav.openChannel('general');
		});
		messagingTest();
	});

	describe('Messaging in created public channel', () => {
		before(()=>{
			if (!publicChannelCreated) {
				sideNav.createChannel(publicChannelName, false, false);
				setPublicChannelCreated(true);
				console.log('	public channel not found, creating one...');
			}
			sideNav.openChannel(publicChannelName);
		});
		messagingTest();
	});
});