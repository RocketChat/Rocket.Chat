Meteor.publish('fullEmojiData', function(filter, limit) {
	if (!this.userId) {
		return this.ready();
	}

	let fields = {
		name: 1,
		aliases: 1,
		extension: 1
	};

	filter = s.trim(filter);

	let options = {
		fields,
		limit,
		sort: { name: 1 }
	};

	if (filter) {
		let filterReg = new RegExp(s.escapeRegExp(filter), 'i');
		return RocketChat.models.EmojiCustom.findByNameOrAlias(filterReg, options);
	}

	return RocketChat.models.EmojiCustom.find({}, options);
});
