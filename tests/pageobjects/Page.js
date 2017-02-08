class Page {
	get body() { return browser.element('body'); }

	open(path) {
		browser.windowHandleSize({
			width: 1280,
			height: 800
		});

		browser.url('http://localhost:3000/' + path);

		this.body.waitForExist();
	}

	setWindowSize(width, height) {
		browser.windowHandleSize({
			width: width,
			height: height
		});
	}
}
module.exports = Page;
