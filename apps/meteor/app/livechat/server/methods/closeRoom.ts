import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { Subscriptions, LivechatRooms } from '../../../models/server';
import { Livechat } from '../lib/Livechat';

type CloseRoomOptions = {
	clientAction?: boolean;
	tags?: string[];
	emailTranscript?:
		| {
				sendToVisitor: false;
		  }
		| {
				sendToVisitor: true;
				requestData: Pick<NonNullable<IOmnichannelRoom['transcriptRequest']>, 'email' | 'subject'>;
		  };
	generateTranscriptPdf?: boolean;
};

Meteor.methods({
	'livechat:closeRoom'(roomId: string, comment?: string, options?: CloseRoomOptions) {
		const userId = Meteor.userId();
		if (!userId || !hasPermission(userId, 'close-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:closeRoom',
			});
		}

		const room = LivechatRooms.findOneById(roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:closeRoom',
			});
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', { method: 'livechat:closeRoom' });
		}

		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:closeRoom',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { _id: 1 });
		if (!subscription && !hasPermission(userId, 'close-others-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:closeRoom',
			});
		}

		return Livechat.closeRoom({
			user,
			room: LivechatRooms.findOneById(roomId),
			comment,
			options: resolveOptions(user, options),
			visitor: undefined,
		});
	},
});

const resolveOptions = (
	user: NonNullable<IOmnichannelRoom['transcriptRequest']>['requestedBy'],
	options?: CloseRoomOptions,
):
	| (CloseRoomOptions & {
			emailTranscript?:
				| {
						sendToVisitor: false;
				  }
				| {
						sendToVisitor: true;
						requestData: NonNullable<IOmnichannelRoom['transcriptRequest']>;
				  };
	  })
	| undefined => {
	if (!options?.emailTranscript) {
		return {
			...options,
			emailTranscript: undefined,
		};
	}
	if (options?.emailTranscript.sendToVisitor === false) {
		return {
			...options,
			emailTranscript: {
				sendToVisitor: false,
			},
		};
	}
	return {
		...options,
		emailTranscript: {
			...options.emailTranscript,
			requestData: {
				...options.emailTranscript.requestData,
				requestedBy: user,
				requestedAt: new Date(),
			},
		},
	};
};
