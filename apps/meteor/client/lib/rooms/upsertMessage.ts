import type { IMessage, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { ChatMessage } from '../../../app/models/client';
import { normalizeThreadMessage } from '../normalizeThreadMessage';
import { onClientMessageReceived } from '../onClientMessageReceived';

export async function upsertMessage(
	{
		msg,
		subscription,
		uid = Tracker.nonreactive(() => Meteor.userId()) ?? undefined,
	}: {
		msg: IMessage & { ignored?: boolean };
		subscription?: ISubscription;
		uid?: IUser['_id'];
	},
	{ direct } = ChatMessage,
): Promise<{
	numberAffected?: number | undefined;
	insertedId?: string | undefined;
}> {
	const userId = msg.u?._id;

	if (subscription?.ignored?.includes(userId)) {
		msg.ignored = true;
	}

	if (msg.t === 'e2e' && !msg.file) {
		msg.e2e = 'pending';
	}
	msg = (await onClientMessageReceived(msg)) || msg;

	const { _id, ...messageToUpsert } = msg;

	if (msg.tcount) {
		direct.update(
			{ tmid: _id },
			{
				$set: {
					following: uid && (msg.replies?.includes(uid) ?? false),
					threadMsg: normalizeThreadMessage(messageToUpsert),
					repliesCount: msg.tcount,
				},
			},
			{ multi: true },
		);
	}

	return direct.upsert({ _id }, messageToUpsert);
}
