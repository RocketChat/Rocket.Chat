import Page from './Page';

class MainContent extends Page {

	get messageInput() { return browser.element('.input-message'); }
	get sendBtn() { return browser.element('.message-buttons.send-button'); }

	sendMessage(text) {
		this.messageInput.setValue(text);
		this.sendBtn.click();
		browser.waitUntil(function() {
			return browser.getText('.message:last-child .body') === text;
		}, 2000);
	}
}

module.exports = new MainContent();