import loginPage from '../pageobjects/login.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

export let publicChannelCreated = false;
export let privateChannelCreated = false;
export let directMessageCreated = false;

export function setPublicChannelCreated(status) {
	publicChannelCreated = status;
}

export function setPrivateChannelCreated(status) {
	privateChannelCreated = status;
}

export function setDirectMessageCreated(status) {
	directMessageCreated = status;
}

export function checkIfUserIsValid(username, email, password) {
	if (!sideNav.accountBoxUserName.isVisible()) {
		//if the user is not logged in.
		console.log('	User not logged. logging in...');
		loginPage.open();
		loginPage.login({email, password});
		try {
			mainContent.mainContent.waitForExist(5000);
		} catch (e) {
			//if the user dont exist.
			console.log('	User dont exist. Creating user...');
			loginPage.gotToRegister();
			loginPage.registerNewUser({username, email, password});
			browser.waitForExist('form#login-card input#username', 5000);
			browser.click('.submit > button');
			mainContent.mainContent.waitForExist(5000);
		}
	} else if (sideNav.accountBoxUserName.getAttribute('data-username') !== username) {
		//if the logged user is not the right one
		console.log('	Wrong logged user. Changing user...');
		sideNav.accountMenu.waitForVisible(5000);
		sideNav.accountMenu.click();
		sideNav.logout.waitForVisible(5000);
		sideNav.logout.click();

		loginPage.open();
		loginPage.login({email, password});
		mainContent.mainContent.waitForExist(5000);
	} else {
		console.log('	User already logged');
	}
}

export function checkIfUserIsAdmin(username, email, password) {
	if (!sideNav.accountBoxUserName.isVisible()) {
		//if the user is not logged in.
		console.log('	User not logged. logging in...');
		loginPage.open();
		loginPage.login({email, password});
		try {
			mainContent.mainContent.waitForExist(5000);
		} catch (e) {
			//if the user dont exist.
			console.log('	Admin User dont exist. Creating user...');
			loginPage.gotToRegister();
			loginPage.registerNewUser({username, email, password});
			browser.waitForExist('form#login-card input#username', 5000);
			browser.click('.submit > button');
			mainContent.mainContent.waitForExist(5000);
		}
	} else if (sideNav.accountBoxUserName.getText() !== username) {
		//if the logged user is not the right one
		console.log('	Wrong logged user. Changing user...');
		sideNav.accountMenu.waitForVisible(5000);
		sideNav.accountMenu.click();
		sideNav.logout.waitForVisible(5000);
		sideNav.logout.click();

		loginPage.open();
		loginPage.login({email, password});
	} else {
		console.log('	User already logged');
	}
}
