class Page {
	get body() {
		return browser.element('body');
	}

	open(path) {
		cy.visit(`/${path}`);
	}
}
export default Page;
