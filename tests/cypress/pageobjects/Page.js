class Page {
	get body() { return browser.element('body'); }

	open(path) {
		cy.visit(`http://localhost:3000/${ path }`);
	}
}
module.exports = Page;
