import loginPage from '../cypress/pageobjects/login.page';

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
	loginPage.open();

	return cy.window().then(({ Meteor }) => {
		const user = Meteor.user();
		if (!user || user.username !== username) {
			return new Promise((resolve) => {
				Meteor.loginWithPassword(email, password, (error) => {
					if (error && error.error === 403) {
						Meteor.logout(() => {
							loginPage.gotToRegister();
							loginPage.registerNewUser({ username, email, password });
							cy.get('form#login-card input#username').should('be.visible');
							cy.get('#login-card button.login').click();
							resolve();
						});
					} else {
						resolve();
					}
				});
			});
		}
	});
}
