import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';
import { isSetNotNull } from '../function-isSet';
import { HTML } from 'meteor/htmljs';

export const renderEmoji = function(emoji) {
	if (isSetNotNull(() => RocketChat.emoji.list[emoji].emojiPackage)) {
		const { emojiPackage } = RocketChat.emoji.list[emoji];
		return RocketChat.emoji.packages[emojiPackage].render(emoji);
	}
};

Blaze.registerHelper('renderEmoji', renderEmoji);

Template.registerHelper('renderEmoji', new Template('renderEmoji', function() {
	const view = this;
	const emoji = Blaze.getData(view);

	if (isSetNotNull(() => RocketChat.emoji.list[emoji].emojiPackage)) {
		const { emojiPackage } = RocketChat.emoji.list[emoji];
		return new HTML.Raw(RocketChat.emoji.packages[emojiPackage].render(emoji));
	}

	return '';
}));
