class Page {
	get body() { return browser.element('body'); }

	open(path, { offline = false }) {
		this.offlineMode(offline);
		cy.visit(`http://localhost:3000/${ path }`);
	}

	offlineMode(offline) {
		cy.server(offline ? { force404: true } : { enable: false });
		offline && cy.reload();
	}
}
module.exports = Page;
