// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import 'cypress-real-events/support';

// Import commands.js using ES2015 syntax:
import './commands';

// Cypress.Cookies.debug(true);

Cypress.Cookies.defaults({
	preserve: ['rc_uid', 'rc_token'],
});

Cypress.LocalStorage.clear = function () {};

Cypress.on('uncaught:exception', (error) => {
	console.error(error);
	return false;
});

// Disable CSS animations
// Cypress.on('window:load', (win) => {
// 	win.document.querySelector('head').insertAdjacentHTML(
// 		'beforeend',
// 		`
// 		  <style>
// 			* { transition-duration: 0.001s !important; animation-duration: 0.001s !important;}
// 		  </style>
// 		`,
// 	);
// });

// Alternatively you can use CommonJS syntax:
// require('./commands')
