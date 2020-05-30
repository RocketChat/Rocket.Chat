import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { HTML } from 'meteor/htmljs';

import { emoji } from '../../lib/rocketchat';
import { isSetNotNull } from '../function-isSet';

export const renderEmoji = function(_emoji) {
	if (isSetNotNull(() => emoji.list[_emoji].emojiPackage)) {
		const { emojiPackage } = emoji.list[_emoji];
		return emoji.packages[emojiPackage].render(_emoji);
	}
};

Blaze.registerHelper('renderEmoji', renderEmoji);

Template.registerHelper('renderEmoji', new Template('renderEmoji', function() {
	const view = this;
	const _emoji = Blaze.getData(view);

	if (isSetNotNull(() => emoji.list[_emoji].emojiPackage)) {
		const { emojiPackage } = emoji.list[_emoji];
		return new HTML.Raw(emoji.packages[emojiPackage].render(_emoji));
	}

	return '';
}));
