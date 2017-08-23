class Global {
	// Sweet Alerts
	get sweetAlertOverlay() { return browser.element('.sweet-overlay'); }
	get sweetAlert() { return browser.element('.sweet-alert'); }
	get sweetAlertConfirm() { return browser.element('.sweet-alert .sa-confirm-button-container'); }
	get sweetAlertCancel() { return browser.element('.sa-button-container .cancel'); }
	get sweetAlertPasswordField() { return browser.element('.sweet-alert [type="password"]'); }
	get sweetAlertFileName() { return browser.element('#file-name'); }
	get sweetAlertFileDescription() { return browser.element('#file-description'); }
	get sweetAlertFilePreview() { return browser.element('.upload-preview-file'); }
	get sweetAlertFileTitle() { return browser.element('.upload-preview-title'); }

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
