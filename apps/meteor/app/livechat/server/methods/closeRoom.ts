import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users, LivechatRooms, Subscriptions as SubscriptionRaw } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { closeRoom } from '../lib/closeRoom';

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

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:closeRoom'(roomId: string, comment?: string, options?: CloseRoomOptions): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:closeRoom'(roomId: string, comment?: string, options?: CloseRoomOptions) {
		methodDeprecationLogger.method('livechat:closeRoom', '7.0.0');

		const userId = Meteor.userId();
		if (!userId || !(await hasPermissionAsync(userId, 'close-livechat-room'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:closeRoom',
			});
		}

		const room = await LivechatRooms.findOneById(roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'livechat:closeRoom',
			});
		}

		const subscription = await SubscriptionRaw.findOneByRoomIdAndUserId(roomId, userId, {
			projection: {
				_id: 1,
			},
		});
		if (!room.open && subscription) {
			await SubscriptionRaw.removeByRoomId(roomId);
			return;
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', { method: 'livechat:closeRoom' });
		}

		const user = await Users.findOneById(userId);
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'livechat:closeRoom',
			});
		}

		if (!subscription && !(await hasPermissionAsync(userId, 'close-others-livechat-room'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:closeRoom',
			});
		}

		await closeRoom({
			user,
			room,
			comment,
			options: resolveOptions(user, options),
		});
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
