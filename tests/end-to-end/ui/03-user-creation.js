/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import loginPage from '../../pageobjects/login.page';
import mainContent from '../../pageobjects/main-content.page';

//test data imports
import {username, email, password} from '../../data/user.js';



//Basic usage test start
describe('[User Creation]', function() {
	this.retries(2);

	before(() => {
		loginPage.open();
		// This Can Cause Timeouts erros if the server is slow so it should have a big wait
		loginPage.emailOrUsernameField.waitForVisible(15000);
	});

	it('it should create user', () => {
		loginPage.gotToRegister();

		loginPage.registerNewUser({username, email, password});

		loginPage.inputUsername.waitForExist(5000);

		loginPage.submitButton.click();

		mainContent.mainContent.waitForExist(5000);
	});
});
