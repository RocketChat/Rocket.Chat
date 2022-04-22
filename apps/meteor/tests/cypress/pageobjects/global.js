class Global {
	// Modal
	get modalOverlay() {
		return browser.element('.rc-modal-wrapper');
	}

	get modal() {
		return browser.element('.rcx-modal');
	}

	get modalConfirm() {
		return browser.element('.rcx-modal .rcx-button--primary-danger');
	}

	get modalCancel() {
		return browser.element('.rc-modal .js-modal');
	}

	get modalPasswordField() {
		return browser.element('.rc-modal [type="password"]');
	}

	get modalFileName() {
		return browser.element('.rc-modal #file-name');
	}

	get modalFileDescription() {
		return browser.element('.rc-modal #file-description');
	}

	get modalFilePreview() {
		return browser.element('.rc-modal .upload-preview-file');
	}

	get modalFileTitle() {
		return browser.element('.rc-modal .upload-preview-title');
	}

	get toastAlert() {
		return browser.element('.toast');
	}

	confirmPopup() {
		this.modalConfirm.waitForVisible(5000);
		browser.pause(500);
		this.modalConfirm.click();
		this.modal.waitForVisible(5000, true);
	}

	setWindowSize(width, height) {
		cy.viewport(width, height);
	}

	dismissToast() {
		this.toastAlert.click();
	}
}

export default new Global();
