/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

// These are Chimp globals
/* globals browser */

const username = 'user-test-'+Date.now();
const channelname = 'channel-test-'+Date.now();
const privatechannelname = 'private-channel-test-'+Date.now();

describe('Basic usage', function() {
	before(function() {
		browser.url('http://localhost:3000');
		browser.windowHandleSize({width:1280, height:800});
	});

	it('load page', function(done) {
		browser.waitForExist('body');
		done();
	});

	it('crate user', function(done) {
		browser.waitForExist('.register');
		browser.click('.register');

		browser.waitForExist('[name=name]');

		browser.setValue('[name=name]', username);
		browser.setValue('[name=email]', username+'@rocket.chat');
		browser.setValue('[name=pass]', 'rocket.chat');
		browser.setValue('[name=confirm-pass]', 'rocket.chat');

		browser.click('.submit > button');

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
		browser.waitForExist('[name=emailOrUsername]');

		browser.setValue('[name=emailOrUsername]', username+'@rocket.chat');
		browser.setValue('[name=pass]', 'rocket.chat');

		browser.click('.submit > button');

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
		const message = 'message from '+username;
		browser.setValue('.input-message', message);

		browser.waitForExist('.message-buttons.send-button');
		browser.click('.message-buttons.send-button');

		browser.waitUntil(function() {
			return browser.getText('.message:last-child .body') === message;
		}, 2000);

		done();
	});

	//DIRECT MESAGE

	it('start a direct message with rocket.cat', function(done) {
		//User to send a private message
		const targetUser = 'rocket.cat';

		browser.click('.add-room:nth-of-type(2)');
		browser.waitForVisible('#who', 50000);

		browser.setValue(' #who', targetUser);
		browser.waitForExist('.-autocomplete-item', 50000);
		browser.click('.-autocomplete-item');

		browser.waitForVisible('.save-direct-message', 50000);
		browser.click('.save-direct-message');
		done();
	});

	it('open the direct message', function(done) {
		browser.waitForExist('ul:nth-of-type(2)');
		browser.click('ul:nth-of-type(2):last-child');

		browser.waitForExist('.input-message', 5000);

		done();
	});

	it('send a direct message', function(done) {
		const message = 'message from '+username;
		browser.setValue('.input-message', message);

		browser.waitForExist('.message-buttons.send-button');
		browser.click('.message-buttons.send-button');

		browser.waitUntil(function() {
			return browser.getText('.message:last-child .body') === message;
		}, 2000);

		done();
	});

	//CHANNEL

	it('create a public channel', function(done) {
		browser.click('.add-room:nth-of-type(1)');
		browser.waitForVisible('#channel-name', 50000);

		browser.setValue(' #channel-name', channelname);

		browser.waitForVisible('.save-channel', 50000);
		browser.click('.save-channel');
		browser.waitForExist('.input-message', 5000);
		done();
	});

	it('send a message in the public channel', function(done) {
		const message = 'message from '+username;

		browser.waitForExist('.input-message');
		browser.waitForVisible('.input-message');
		browser.setValue('.input-message', message);

		browser.waitForExist('.message-buttons.send-button');
		browser.click('.message-buttons.send-button');

		browser.waitUntil(function() {
			return browser.getText('.message:last-child .body') === message;
		}, 2000);

		done();
	});

	it('add people to the room', function(done) {
		const targetUser = 'rocket.cat';
		browser.waitForExist('.icon-users');
		browser.click('.icon-users');

		browser.waitForVisible('#user-add-search', 50000);
		browser.setValue('#user-add-search', targetUser);
		browser.waitForExist('.-autocomplete-item', 50000);
		browser.click('.-autocomplete-item');
		done();
	});

	it('remove people from room', function(done) {
		browser.waitForVisible('.user-card-room');
		browser.click('.user-card-room');

		browser.waitForVisible('.remove-user');
		browser.click('.remove-user');

		browser.waitForExist('.confirm');
		browser.click('.confirm');
		browser.pause(3000);
		done();
	});

	it('archive the room', function(done) {
		browser.waitForExist('.tab-button', 50000);
		browser.waitForVisible('.tab-button', 50000);
		browser.click('.tab-button:nth-of-type(2)');

		browser.waitForVisible('.clearfix:last-child .icon-pencil', 50000);
		browser.click('.clearfix:last-child .icon-pencil');

		browser.waitForVisible('.editing', 50000);
		browser.click('.editing');

		browser.waitForVisible('.save', 50000);
		browser.click('.save');

		done();
	});

	it('open GENERAL', function(done) {
		browser.waitForExist('.wrapper > ul .link-room-GENERAL', 50000);
		browser.click('.wrapper > ul .link-room-GENERAL');

		browser.waitForExist('.input-message', 5000);

		done();
	});

	//Private Channel

	it('create a private channel', function(done) {
		browser.click('.add-room:nth-of-type(1)');
		browser.waitForVisible('#channel-name', 50000);

		browser.setValue(' #channel-name', privatechannelname);

		browser.click('#channel-type');

		browser.waitForVisible('.save-channel', 50000);
		browser.click('.save-channel');
		browser.waitForExist('.input-message', 5000);
		done();
	});

	it('send a message in the private channel', function(done) {
		const message = 'message from '+username;
		browser.setValue('.input-message', message);


		browser.waitForVisible('.message-buttons.send-button');
		browser.click('.message-buttons.send-button');

		browser.waitUntil(function() {
			return browser.getText('.message:last-child .body') === message;
		}, 2000);

		done();
	});

	it('add people to the room', function(done) {
		const targetUser = 'rocket.cat';
		browser.waitForExist('.icon-users');
		browser.click('.icon-users');

		browser.waitForVisible('#user-add-search', 50000);
		browser.setValue('#user-add-search', targetUser);
		browser.waitForExist('.-autocomplete-item', 50000);
		browser.click('.-autocomplete-item');
		done();
	});

	it('remove people from room', function(done) {
		browser.waitForVisible('.user-card-room');
		browser.click('.user-card-room');

		browser.waitForVisible('.remove-user');
		browser.click('.remove-user');

		browser.waitForExist('.confirm');
		browser.click('.confirm');

		browser.pause(3000);

		done();
	});

	it('archive the room', function(done) {
		browser.waitForExist('.tab-button', 50000);
		browser.waitForVisible('.tab-button', 50000);
		browser.click('.tab-button:nth-of-type(2)');

		browser.waitForVisible('.clearfix:last-child .icon-pencil', 50000);
		browser.click('.clearfix:last-child .icon-pencil');

		browser.waitForVisible('.editing', 50000);
		browser.click('.editing');

		browser.waitForVisible('.save', 50000);
		browser.click('.save');

		done();
	});
});
