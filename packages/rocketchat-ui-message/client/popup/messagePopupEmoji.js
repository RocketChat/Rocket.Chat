Template.messagePopupEmoji.helpers({
	value() {
		const length = this.data.length;
		return this.data[length - 1];
	}
});
