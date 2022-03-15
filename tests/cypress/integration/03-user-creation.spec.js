import loginPage from '../pageobjects/login.page';
import { username, email, password } from '../../data/user.js';

// Basic usage test start
describe('[User Creation]', function () {
	before(() => {
		loginPage.open();
	});

	it('it should create user', () => {
		loginPage.gotToRegister();

		loginPage.registerNewUser({ username, email, password });

		loginPage.usernameField.should('be.visible');

		loginPage.submitButton.click();
	});
});
