/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

// These are Chimp globals
/* globals browser */

const username = 'user-test-'+Date.now();

describe('Basic usage', function() {
	before(function() {
		browser.url('http://localhost:3000');
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
});
