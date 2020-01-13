// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => cy.window().then(({ Meteor }) => {
	Meteor.loginWithPassword(email, password, () => {});
}));

Cypress.Commands.add('logout', () => cy.window().then(({ Meteor, FlowRouter, RocketChat }) => {
	const user = Meteor.user();
	if (user) {
		Meteor.logout(() => {
			RocketChat.callbacks.run('afterLogoutCleanUp', user);
			Meteor.call('logoutCleanUp', user);
			FlowRouter.go('home');
		});
	}
}));

//
// -- This is a child command --
Cypress.Commands.add('getLocation', { prevSubject: 'element' }, (subject) => subject.get(0).getBoundingClientRect());
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

global.browser = {
	element(attr) {
		return cy.get(attr);
	},
};
