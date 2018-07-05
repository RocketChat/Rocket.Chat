Template.messageAttachment.helpers({
	injectIndex(data, previousIndex, index) {
		data.index = `${ previousIndex }.attachments.${ index }`;
	},

	getImageHeight(height = 200) {
		return height;
	},
});