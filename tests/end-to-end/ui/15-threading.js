/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback, no-var, space-before-function-paren,
quotes, prefer-template, no-undef, no-unused-vars*/

import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import threading from '../../pageobjects/threading.page';
import { username, email, password } from '../../data/user.js';
import { checkIfUserIsValid } from '../../data/checks';
const parentChannelName = 'unit-testing';
const message = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

const Keys = {
	'TAB': '\uE004',
	'ENTER': '\uE007',
	'ESCAPE': 'u\ue00c'
};

escape = function() {
	browser.keys(Keys.ESCAPE);
};

describe('[Threading]', function () {

	before(function () {
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearchIcon.waitForVisible(3000);

		try {
			sideNav.spotlightSearchIcon.click();
			sideNav.searchChannel(parentChannelName);
			console.log('Parent channel already Exists');
		} catch (e) {
			escape(); //leave a potentially opened search
			sideNav.createChannel(parentChannelName, false, false);
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

	describe('[Clean Up]', function () {
		it('remove parent channel', () => {
			threading.deleteRoom(parentChannelName);
		});
	});

});

// describe('[Threading from context menu]', function () {
// 	const threadName = 'execute-test-cases';
// 	let threadNameThreaded = null;
// 	const inChatHelp = 'what-is-test-case';

// 	before(() => {
// 		try {
// 			sideNav.searchChannel(inChatHelp);
// 			threading.deleteRoom(inChatHelp);
// 			console.log('Cleanup request from last run');
// 		} catch (e) {
// 			console.log('In-Chat-Help preparation done');
// 		}
// 	});

// 	it('Create a Expertise', function () {
// 		try {
// 			threading.escape();
// 			sideNav.searchChannel(parentChannelName);
// 			console.log('Expertise already Exists');
// 		} catch (e) {
// 			threading.escape();
// 			threading.createTopic(parentChannelName, adminUsername);
// 			console.log('New Expertise created');
// 		}
// 	});

// 	it('Create a threadName', function () {
// 		try {
// 			threading.escape();
// 			sideNav.searchChannel(threadName);
// 			console.log('threadName already Exists');
// 			threading.sendTopicMessage(message);
// 		} catch (e) {
// 			threading.escape();
// 			threading.createthreadName(parentChannelName, message, threadName);
// 			console.log('New Help Request Created');
// 		}
// 	});

// 	describe('Thread:', () => {
// 		before(() => {
// 			sideNav.discovery.waitForVisible(3000);
// 			mainContent.openMessageActionMenu();
// 		});

// 		it('it should show a dialog for starting a thread', () => {
// 			mainContent.selectAction('thread');
// 		});

// 		it.skip('it should fill values in popup', function () {
// 			globalObject.enterModalText(inChatHelp);
// 			browser.pause(1000);
// 		});

// 		it('It should create a new request from chat Room', function () {
// 			globalObject.confirmPopup();
// 			mainContent.channelTitle.waitForVisible(3000);
// 			threadNameThreaded = mainContent.channelTitle.getText();
// 			sideNav.discovery.waitForVisible(3000);
// 		});

// 		it.skip('It should show the thread\'s request room', function () {
// 			sideNav.searchChannel(threadName);
// 			sideNav.discovery.waitForVisible(3000);
// 		});

// 		it('The message should be copied', function () {
// 			try {
// 				mainContent.waitForLastMessageEqualsText(message);
// 			} catch (e) {
// 				console.log('message not propagated to child help request');
// 			}
// 		});
// 	});
// 	after(function () {
// 		describe('[Clean Up]', function () {
// 			it('close the topics and request', () => {
// 				console.log('Clean for the Topic and Expertise Started...', parentChannelName);
// 				threading.deleteRoom(threadName);
// 				threading.deleteRoom(threadNameThreaded);
// 				browser.pause(1000);
// 				threading.deleteRoom(parentChannelName);
// 			});
// 		});
// 	});
// });
