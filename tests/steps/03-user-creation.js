/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import loginPage from '../pageobjects/login.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

//test data imports
import {username, email, password, adminUsername, adminEmail, adminPassword} from '../test-data/user.js';



//Basic usage test start
describe('User Creation', function() {
	this.retries(2);

	before(() => {
		loginPage.open();
	});

	/*If you are using a clean database dont pass any environment variables
	if you have an existing database please pass the username (ADMIN_USERNAME) and password (ADMIN_PASS) of the admin as environment variables.*/

	if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASS) {
		console.log('Admin login and password provided, skipping admin creation.');
	} else {
		it('create the admin user', () => {
			loginPage.gotToRegister();

			loginPage.registerNewAdmin({adminUsername, adminEmail, adminPassword});

			browser.waitForExist('form#login-card input#username', 5000);

			browser.click('.submit > button');

			mainContent.mainContent.waitForExist(5000);
		});

		it('logout', () => {
			sideNav.accountBoxUserName.waitForVisible(5000);
			sideNav.accountBoxUserName.click();
			browser.pause(200);

			sideNav.logout.waitForVisible(5000);
			sideNav.logout.click();
		});
	}

	it('create user', () => {
		loginPage.gotToRegister();

		loginPage.registerNewUser({username, email, password});

		browser.waitForExist('form#login-card input#username', 5000);

		browser.click('.submit > button');

		mainContent.mainContent.waitForExist(5000);
	});
});
