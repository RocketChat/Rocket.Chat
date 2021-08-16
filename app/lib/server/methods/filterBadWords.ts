import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import Filter from 'bad-words';

import { settings } from '../../../settings/server';
import { callbacks } from '../../../callbacks/server';
import { IMessage } from '../../../../definition/IMessage';


Meteor.startup(() => {
	Tracker.autorun(() => {
		const allowBadWordsFilter = settings.get('AllowBadWordsFilter');

		if (!allowBadWordsFilter) {
			return callbacks.remove('beforeSaveMessage', 'filterBadWords');
		}

		const badWordsList = settings.get('Message_BadWordsFilterList') as string | undefined;
		const whiteList = settings.get('Message_BadWordsWhitelist') as string | undefined;

		const options = {
			list: badWordsList?.split(',').map((word) => word.trim()) || [],
			// library definition does not allow optional definition
			exclude: undefined,
			splitRegex: undefined,
			placeHolder: undefined,
			regex: undefined,
			replaceRegex: undefined,
			emptyList: undefined,
		};

		const filter = new Filter(options);

		if (whiteList?.length) {
			filter.removeWords(...whiteList.split(',').map((word) => word.trim()));
		}

		callbacks.add('beforeSaveMessage', function(message: IMessage) {
			if (!message.msg) {
				return message;
			}
			message.msg = filter.clean(message.msg);
		}, callbacks.priority.HIGH, 'filterBadWords');
	});
});
