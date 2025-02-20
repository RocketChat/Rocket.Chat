import type { IRoom } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Messages, Subscriptions } from '../../app/models/client';
import { LegacyRoomManager, upsertMessage } from '../../app/ui-utils/client';
import { callWithErrorHandling } from '../lib/utils/callWithErrorHandling';

const loadMissedMessages = async function (rid: IRoom['_id']): Promise<void> {
	const lastMessage = Messages.findOne({ rid, _hidden: { $ne: true }, temp: { $exists: false } }, { sort: { ts: -1 }, limit: 1 });

	if (!lastMessage) {
		return;
	}

	try {
		const result = await callWithErrorHandling('loadMissedMessages', rid, lastMessage.ts);
		if (result) {
			const subscription = Subscriptions.findOne({ rid });
			await Promise.all(Array.from(result).map((msg) => upsertMessage({ msg, subscription })));
		}
	} catch (error) {
		console.error(error);
	}
};

Meteor.startup(() => {
	let connectionWasOnline = true;
	Tracker.autorun(() => {
		const { connected } = Meteor.connection.status();

		if (connected === true && connectionWasOnline === false && LegacyRoomManager.openedRooms) {
			Object.keys(LegacyRoomManager.openedRooms).forEach((key) => {
				const value = LegacyRoomManager.openedRooms[key];
				if (value.rid) {
					loadMissedMessages(value.rid);
				}
			});
		}
		connectionWasOnline = connected;
	});
});
