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
import 'cypress-wait-until';

// -- This is a parent command --
Cypress.Commands.add('login', (email, password) =>
	cy.window().then(
		({ Meteor }) =>
			new Promise((resolve) => {
				Meteor.loginWithPassword(email, password, resolve);
			}),
	),
);

Cypress.Commands.add('logout', () =>
	cy.window().then(
		({ Meteor, FlowRouter }) =>
			new Promise((resolve) => {
				Meteor.startup(() => {
					setTimeout(() => {
						const user = Meteor.user();
						if (!user) {
							return resolve();
						}

						Meteor.logout(() => {
							Meteor.call('logoutCleanUp', user);
							FlowRouter.go('home');
							resolve();
						});
					}, 500);
				});
			}),
	),
);

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
