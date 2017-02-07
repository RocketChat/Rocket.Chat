/* globals HTML, isSetNotNull, renderEmoji:true */
renderEmoji = function(emoji) {
	if (isSetNotNull(() => RocketChat.emoji.list[emoji].emojiPackage)) {
		const emojiPackage = RocketChat.emoji.list[emoji].emojiPackage;
		return RocketChat.emoji.packages[emojiPackage].render(emoji);
	}
};

Blaze.registerHelper('renderEmoji', renderEmoji);

Template.registerHelper('renderEmoji', new Template('renderEmoji', function() {
	const view = this;
	const emoji = Blaze.getData(view);

	if (isSetNotNull(() => RocketChat.emoji.list[emoji].emojiPackage)) {
		const emojiPackage = RocketChat.emoji.list[emoji].emojiPackage;
		return new HTML.Raw(RocketChat.emoji.packages[emojiPackage].render(emoji));
	}

	return '';
}));

/* exported renderEmoji */
