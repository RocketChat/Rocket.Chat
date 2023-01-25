import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Users, LivechatRooms, Subscriptions as SubscriptionRaw } from '@rocket.chat/models';

import { hasPermission } from '../../../authorization/server';
import { Livechat } from '../lib/LivechatTyped';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

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

type LivechatCloseRoomOptions = Omit<CloseRoomOptions, 'generateTranscriptPdf'> & {
	emailTranscript?:
		| {
				sendToVisitor: false;
		  }
		| {
				sendToVisitor: true;
				requestData: NonNullable<IOmnichannelRoom['transcriptRequest']>;
		  };
	pdfTranscript?: {
		requestedBy: string;
	};
};

Meteor.methods({
	'livechat:closeRoom'(roomId: string, comment?: string, options?: CloseRoomOptions) {
		methodDeprecationLogger.warn(
			'livechat:closeRoom is deprecated and will be removed in next major version. Use /api/v1/livechat/room.closeByUser API instead.',
		);

		const userId = Meteor.userId();
		if (!userId || !hasPermission(userId, 'close-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:closeRoom',
			});
		}

		const room = Promise.await(LivechatRooms.findOneById(roomId));
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:closeRoom',
			});
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', { method: 'livechat:closeRoom' });
		}

		const user = Promise.await(Users.findOneById(userId));
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:closeRoom',
			});
		}

		const subscription = Promise.await(
			SubscriptionRaw.findOneByRoomIdAndUserId(roomId, user._id, {
				projection: {
					_id: 1,
				},
			}),
		);
		if (!subscription && !hasPermission(userId, 'close-others-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:closeRoom',
			});
		}

		Promise.await(
			Livechat.closeRoom({
				user,
				room,
				comment,
				options: resolveOptions(user, options),
			}),
		);
	},
});

const resolveOptions = (
	user: NonNullable<IOmnichannelRoom['transcriptRequest']>['requestedBy'],
	options?: CloseRoomOptions,
): LivechatCloseRoomOptions | undefined => {
	if (!options) {
		return undefined;
	}

	const resolvedOptions: LivechatCloseRoomOptions = {
		clientAction: options.clientAction,
		tags: options.tags,
	};

	if (options.generateTranscriptPdf) {
		resolvedOptions.pdfTranscript = {
			requestedBy: user._id,
		};
	}

	if (!options?.emailTranscript) {
		return resolvedOptions;
	}
	if (options?.emailTranscript.sendToVisitor === false) {
		return {
			...resolvedOptions,
			emailTranscript: {
				sendToVisitor: false,
			},
		};
	}
	return {
		...resolvedOptions,
		emailTranscript: {
			sendToVisitor: true,
			requestData: {
				...options.emailTranscript.requestData,
				requestedBy: user,
				requestedAt: new Date(),
			},
		},
	};
};
