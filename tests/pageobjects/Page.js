class Page {
	get body() { return browser.element('body'); }

	open(path) {
		browser.windowHandleSize({
			width: 1600,
			height: 1600,
		});

		browser.url(`http://localhost:3000/${ path }`);

		this.body.waitForExist();
	}
}
module.exports = Page;
