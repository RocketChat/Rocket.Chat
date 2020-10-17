import Filter from 'bad-words';

import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';

callbacks.add('beforeSaveMessage', function(message) {
	if (settings.get('Message_AllowBadWordsFilter')) {
		const badWordsList = settings.get('Message_BadWordsFilterList');
		let options;
		let { msg } = message;
		// Convert diacritics to english words
		msg = msg.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		// Add words to the blacklist
		if (!!badWordsList && badWordsList.length) {
			options = {
				list: badWordsList.split(','),
			};
		}
		const filter = new Filter(options);
		message.msg = filter.clean(msg);
	}

	return message;
}, 1, 'filterBadWords');
