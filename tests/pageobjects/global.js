class Global {
	get sweetAlertOverlay() { return browser.element('.sweet-overlay'); }
	get sweetAlert() { return browser.element('.sweet-alert'); }
	get sweetAlertConfirm() { return browser.element('.sweet-alert .sa-confirm-button-container'); }
	get sweetAlertPasswordField() { return browser.element('.sweet-alert [type="password"]'); }
	get toastAlert() { return browser.element('.toast'); }
}

module.exports = new Global();