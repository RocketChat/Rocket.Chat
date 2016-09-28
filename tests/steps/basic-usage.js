/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import loginPage from '../pageobjects/login.page';
import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

//Login info from the test user
const username = 'user-test-'+Date.now();
const email = username+'@rocket.chat';
const password = 'rocket.chat';

//Names of the test channels
const PublicChannelName = 'channel-test-'+Date.now();
const privateChannelName = 'private-channel-test-'+Date.now();

//User interactions(direct messages, add, remove...)
const targetUser = 'rocket.cat';

//Test data
const message = 'message from '+username;



//Basic usage test start
describe('Basic usage', function() {
	it('load page', () => {
		loginPage.open();
		// browser.windowHandleSize({width:1280, height:800});
	});

	it('crate user', function(done) {
		loginPage.gotToRegister();

		loginPage.registerNewUser({username, email, password});

		browser.waitForExist('form#login-card input#username', 5000);

		browser.click('.submit > button');

		browser.waitForExist('.main-content', 5000);

		done();
	});

	it('logout', function(done) {
		browser.waitForVisible('.account-box');
		browser.click('.account-box');
		browser.pause(200);

		browser.waitForVisible('#logout');
		browser.click('#logout');

		done();
	});

	it('login', function(done) {
		loginPage.login({email, password});
		browser.waitForExist('.main-content', 5000);

		done();
	});

	it('open GENERAL', function(done) {
		browser.waitForExist('.wrapper > ul .link-room-GENERAL', 50000);
		browser.click('.wrapper > ul .link-room-GENERAL');

		browser.waitForExist('.input-message', 5000);

		done();
	});

	it('send a message', function(done) {
		mainContent.sendMessage(message);
		done();
	});

	//DIRECT MESAGE

	it('start a direct message with rocket.cat', function(done) {
		sideNav.startDirectMessage(targetUser);
		done();
	});

	it('open the direct message', function(done) {
		sideNav.openChannel(targetUser);
		done();
	});

	it('send a direct message', function(done) {
		mainContent.sendMessage(message);
		done();
	});

	//CHANNEL

	it('create a public channel', function(done) {
		sideNav.createChannel(PublicChannelName, false, false);
		sideNav.openChannel(PublicChannelName);
		done();
	});

	it('send a message in the public channel', function(done) {
		mainContent.sendMessage(message);
		done();
	});

	it('add people to the room', function(done) {
		flexTab.addPeopleToChannel(targetUser);
		done();
	});

	it('remove people from room', function(done) {
		flexTab.closeTabs();
		flexTab.removePeopleFromChannel(targetUser);
		flexTab.confirmPopup();
		done();
	});

	it('archive the room', function(done) {
		flexTab.archiveChannel();
		flexTab.closeTabs();
		done();
	});

	it('open GENERAL', function(done) {
		sideNav.openChannel('general');
		done();
	});

	//Private Channel

	it('create a private channel', function(done) {
		sideNav.createChannel(privateChannelName, true, false);
		done();
	});

	it('send a message in the private channel', function(done) {
		mainContent.sendMessage(message);
		done();
	});

	it('add people to the room', function(done) {
		flexTab.addPeopleToChannel(targetUser);
		done();
	});

	it('remove people from room', function(done) {
		flexTab.closeTabs();
		flexTab.removePeopleFromChannel(targetUser);
		flexTab.confirmPopup();
		done();
	});

	it('archive the room', function(done) {
		flexTab.archiveChannel();
		flexTab.closeTabs();
		done();
	});
});
