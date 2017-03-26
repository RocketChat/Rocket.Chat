const Filter = Npm.require('bad-words');

RocketChat.callbacks.add('beforeSaveMessage', function(message) {

	if (RocketChat.settings.get('Message_AllowBadWordsFilter')) {
		const badWordsList = RocketChat.settings.get('Message_BadWordsFilterList');
		let options;

		// Add words to the blacklist
		if (!!badWordsList && badWordsList.length) {
			options = {
				list: badWordsList.split(',')
			};
		}
		const filter = new Filter(options);
		message.msg = filter.clean(message.msg);
	}

	return message;

}, 1, 'filterBadWords');
