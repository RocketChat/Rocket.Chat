Template.messagePopupEmoji.helpers({
	value() {
		const { length } = this.data;
		return this.data[length - 1];
	},
});
