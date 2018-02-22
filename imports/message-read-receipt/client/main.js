Template.main.helpers({
	readReceiptsEnabled() {
		if (RocketChat.settings.get('Message_Read_Receipt_Store_Users')) {
			return 'read-receipts-enabled';
		}
	}
});
