import Filter from 'bad-words';

import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';

callbacks.add('beforeSaveMessage', function(message) {
	if (settings.get('Message_AllowBadWordsFilter')) {
		const badWordsList = settings.get('Message_BadWordsFilterList');
		let options;

		// Add words to the blacklist
		if (!!badWordsList && badWordsList.length) {
			options = {
				list: badWordsList.split(','),
			};
		}
		const filter = new Filter(options);
		message.msg = filter.clean(message.msg);
	}

	return message;
}, 1, 'filterBadWords');
