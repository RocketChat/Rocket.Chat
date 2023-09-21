import type { IUiKitCoreApp } from '@rocket.chat/core-services';

// import { VideoConf } from '@rocket.chat/core-services';
import { addUsersToRoomMethod } from '../../../app/lib/server/methods/addUsersToRoom';
// import { i18n } from '../../lib/i18n';

export class MentionModule implements IUiKitCoreApp {
	appId = 'mention-core';

	async blockAction(payload: any): Promise<any> {
		const {
			// triggerId,
			actionId,
			payload: { value: commaSeparatedUsernames },
			// user: { _id: userId },
		} = payload;

		console.log('payload', payload);

		if (actionId === 'dismiss') {
			// TODO: Remove actions from ephemeral message
			// TODO: Update message after interaction.
			// You mentioned Rachel Berry, but they’re not in this room.  (if mentioned user is added to room remove actions)
			console.log('ignore');
			// do nothing button
		}

		const usernames = commaSeparatedUsernames.split(',');
		if (actionId === 'add-users') {
			// TODO: Remove actions from ephemeral message
			console.log('add-users');
			void addUsersToRoomMethod(payload.user._id, { rid: payload.room, users: usernames }, payload.user);
			// add users to channel
		}

		if (actionId === 'share-message') {
			// TODO: Remove actions from ephemeral message
			// TODO: update ephemeral message to have the following key
			// You_mentioned___mentions__but_theyre_not_in_this_room_You_let_them_know_via_dm
			console.log('share-message');
			// let them know button
		}
	}
}
