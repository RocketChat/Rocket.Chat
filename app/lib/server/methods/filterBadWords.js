import Filter from 'bad-words';

import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';

callbacks.add('beforeSaveMessage', function(message) {
	if (settings.get('Message_AllowBadWordsFilter')) {
		const badWordsList = settings.get('Message_BadWordsFilterList');
		let whiteList = settings.get('Message_BadWordsWhitelist');
		let options;

		// Add words to the blacklist
		if (!!badWordsList && badWordsList.length) {
			options = {
				list: badWordsList.split(','),
			};
		}
		const filter = new Filter(options);

		if (whiteList?.length) {
			whiteList = whiteList.split(',').map((word) => word.trim());
			filter.removeWords(...whiteList);
		}

		message.msg = filter.clean(message.msg);
	}

	return message;
}, 1, 'filterBadWords');
