/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import sideNav from '../pageobjects/side-nav.page';
import {publicChannelName, privateChannelName} from '../test-data/channel.js';
import {targetUser} from '../test-data/interactions.js';

//test data imports
import {checkIfUserIsValid, setPublicChannelCreated, setPrivateChannelCreated, setDirectMessageCreated} from '../test-data/checks';
import {username, email, password} from '../test-data/user.js';
//Basic usage test start
describe('Channel creation', function() {
	before(()=>{
		checkIfUserIsValid(username, email, password);
		sideNav.getChannelFromList('general').waitForExist(5000);
		sideNav.openChannel('general');
	});

	beforeEach(()=>{
		browser.pause(300);
		sideNav.getChannelFromList('general').waitForVisible(5000);
		sideNav.openChannel('general');
		browser.pause(300);
	});

	afterEach(function() {
		if (this.currentTest.state !== 'passed' && this.currentTest.title !== 'should close the channel creation tab') {
			setPublicChannelCreated(false);
			switch (this.currentTest.title) {
				case 'create a public channel':
					setPublicChannelCreated(false);
					console.log('Public channel Not Created!');
					break;
				case 'create a private channel':
					setPrivateChannelCreated(false);
					console.log('Private channel Not Created!');
					break;
				case 'start a direct message with rocket.cat':
					setDirectMessageCreated(false);
					console.log('Direct Message Not Created!');
					break;
			}
		}
	});

	describe('create a public channel', function() {
		it('create a public channel', function() {
			sideNav.createChannel(publicChannelName, false, false);
			setPublicChannelCreated(true);
		});

		it('should close the channel creation tab', function() {
			sideNav.channelType.isVisible().should.be.false;
		});
	});

	describe('create a private channel', function() {
		it('create a private channel', function() {
			sideNav.createChannel(privateChannelName, true, false);
			setPrivateChannelCreated(true);
		});

		it('should close the channel creation tab', function() {
			sideNav.channelType.isVisible().should.be.false;
		});
	});

	describe('direct channel', function() {
		it('start a direct message with rocket.cat', function() {
			sideNav.startDirectMessage(targetUser);
			setDirectMessageCreated(true);
		});

		it('should close the channel creation tab', function() {
			sideNav.channelType.isVisible().should.be.false;
		});
	});
});
