import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { ChatMessage } from '../../../app/models/client';
import { upsertMessage } from './upsertMessage';

export function upsertMessageBulk(
	{ msgs, subscription }: { msgs: IMessage[]; subscription?: ISubscription },
	collection = ChatMessage,
): void {
	const uid = Tracker.nonreactive(() => Meteor.userId()) ?? undefined;
	const { queries } = collection;
	collection.queries = [];
	msgs.forEach((msg, index) => {
		if (index === msgs.length - 1) {
			collection.queries = queries;
		}
		upsertMessage({ msg, subscription, uid }, collection);
	});
}
