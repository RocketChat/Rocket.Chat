import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { EmojiCustom } from '../../../models';

Meteor.publish('fullEmojiData', function(filter, limit) {
	console.warn('The publication "fullEmojiData" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.ready();
	}

	const fields = {
		name: 1,
		aliases: 1,
		extension: 1,
	};

	filter = s.trim(filter);

	const options = {
		fields,
		limit,
		sort: { name: 1 },
	};

	if (filter) {
		const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
		return EmojiCustom.findByNameOrAlias(filterReg, options);
	}

	return EmojiCustom.find({}, options);
});
