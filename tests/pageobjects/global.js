class Global {
	get sweetAlertOverlay() { return browser.element('.sweet-overlay'); }
	get sweetAlert() { return browser.element('.sweet-alert'); }
	get sweetAlertConfirm() { return browser.element('.sweet-alert .sa-confirm-button-container'); }
	get sweetAlertPasswordField() { return browser.element('.sweet-alert [type="password"]'); }
	get toastAlert() { return browser.element('.toast'); }

	confirmPopup() {
		this.sweetAlertConfirm.waitForVisible(5000);
		browser.pause(500);
		this.sweetAlertConfirm.click();
		this.sweetAlert.waitForVisible(5000, true);
	}

	setWindowSize(width, height) {
		browser.windowHandleSize({
			width,
			height
		});
	}

	dismissToast() {
		this.toastAlert.click();
	}
}

module.exports = new Global();
