const testUrl = process.env.TEST_URL || 'http://localhost:3000';

class Page {
	get body() {
		return browser.element('body');
	}

	open(path) {
		cy.visit(`${testUrl}/${path}`);
	}
}
module.exports = Page;
