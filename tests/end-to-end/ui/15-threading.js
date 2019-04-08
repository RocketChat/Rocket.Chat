/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback, no-var, space-before-function-paren,
quotes, prefer-template, no-undef, no-unused-vars*/

import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import { sendEscape } from '../../pageobjects/keyboard';
import { threading } from '../../pageobjects/threading.page';
import { username, email, password } from '../../data/user.js';
import { checkIfUserIsValid } from '../../data/checks';
const parentChannelName = 'unit-testing';
const message = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

describe('[Threading]', function () {

	before(function () {
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearchIcon.waitForVisible(3000);

		try {
			sideNav.spotlightSearchIcon.click();
			sideNav.searchChannel(parentChannelName);
			console.log('Parent channel already Exists');
		} catch (e) {
			sendEscape(); // leave a potentially opened search
			sideNav.createChannel(parentChannelName, true, false);
			console.log('Parent channel created');
		}
	});

	describe('via creation screen', function() {
		it('Create a thread', function () {
			threading.createThread(parentChannelName, message);
		});
	});

	describe('from context menu', function() {
		before(() => {
			browser.pause(2000);
			sideNav.openChannel(parentChannelName);
			mainContent.sendMessage(message);
		});

		it('it should show a dialog for starting a thread', () => {
			mainContent.openMessageActionMenu();
			threading.startThreadContextItem.click();
		});

		it('it should have create a new room', function () {
			mainContent.channelTitle.waitForVisible(3000);
		});

		it('The message should be copied', function () {
			mainContent.waitForLastMessageEqualsText(message);
		});
	});

	after(function () {
		it('remove parent channel', () => {
			threading.deleteRoom(parentChannelName);
		});
	});

});
