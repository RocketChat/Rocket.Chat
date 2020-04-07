import loginPage from '../pageobjects/login.page';

const version = 'viasat-0.1';
const file = '/manifest.json';

describe('[Service-Worker]', () => {
	before(() => {
		loginPage.open();
	});

	it('it should support service worker', () => {
		cy.window().then((win) => { expect(!!win.navigator.serviceWorker).to.equal(true); });
	});

	it('it should be in active state', () => {
		cy.window().then((win) => {
			const value = win.navigator.serviceWorker.controller;
			expect(value.state).to.equal('activated');
		});
	});

	it('it should create the cache storage', () => {
		cy.window().then(() => caches.has(version)).then((exist) => {
			expect(exist).to.equal(true);
		});
	});

	it('it should cache the manifest file', () => {
		cy.window().then(() => {
			caches.open(version).then((storage) => {
				storage.match(file).then((response) => {
					expect(response.status).to.equal(200);
				});
			});
		});
	});
});
