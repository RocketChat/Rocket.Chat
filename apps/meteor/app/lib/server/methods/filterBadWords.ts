import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import Filter from 'bad-words';
import type { IMessage } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';

const Dep = new Tracker.Dependency();
Meteor.startup(() => {
	settings.watchMultiple(['Message_AllowBadWordsFilter', 'Message_BadWordsFilterList', 'Message_BadWordsWhitelist'], () => {
		Dep.changed();
	});
	Tracker.autorun(() => {
		Dep.depend();
		const allowBadWordsFilter = settings.get('Message_AllowBadWordsFilter');

		callbacks.remove('beforeSaveMessage', 'filterBadWords');

		if (!allowBadWordsFilter) {
			return;
		}

		const badWordsList = settings.get('Message_BadWordsFilterList') as string | undefined;
		const whiteList = settings.get('Message_BadWordsWhitelist') as string | undefined;

		const options = {
			list:
				badWordsList
					?.split(',')
					.map((word) => word.trim())
					.filter(Boolean) || [],
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

		callbacks.add(
			'beforeSaveMessage',
			(message: IMessage) => {
				if (!message.msg) {
					return message;
				}
				try {
					message.msg = filter.clean(message.msg);
				} finally {
					// eslint-disable-next-line no-unsafe-finally
					return message;
				}
			},
			callbacks.priority.HIGH,
			'filterBadWords',
		);
	});
});
