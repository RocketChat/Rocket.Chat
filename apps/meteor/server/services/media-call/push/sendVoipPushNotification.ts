import type { IMediaCall, IUser, MediaCallContact, MediaCallActorType } from '@rocket.chat/core-typings';
import type { VoipPushNotificationEventType } from '@rocket.chat/media-calls';
import { MediaCalls, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { getPushNotificationType } from './getPushNotificationType';
import { metrics } from '../../../../app/metrics/server/lib/metrics';
import { Push } from '../../../../app/push/server/push';
import PushNotification from '../../../../app/push-notifications/server/lib/PushNotification';
import { settings } from '../../../../app/settings/server';
import { getUserAvatarURL } from '../../../../app/utils/server/getUserAvatarURL';
import { logger } from '../logger';

async function getActorUser<T extends Pick<IUser, '_id' | 'name' | 'username' | 'freeSwitchExtension'>>(
	actor: MediaCallContact,
): Promise<T | null> {
	const options = { projection: { name: 1, username: 1, freeSwitchExtension: 1 } };

	switch (actor.type) {
		case 'user':
			return Users.findOneById<T>(actor.id, options);
		case 'sip':
			return Users.findOneByFreeSwitchExtension<T>(actor.id, options);
	}
}

async function getActorUserData(
	actor: MediaCallContact,
): Promise<{ type: MediaCallActorType; id: string; name: string; avatarUrl?: string }> {
	const actorUsername = actor.type === 'user' ? actor.username : undefined;
	const actorExtension = actor.sipExtension || (actor.type === 'sip' ? actor.id : undefined);

	const data = {
		type: actor.type,
		id: actor.id,
		name: actor.displayName || actorUsername || actorExtension || '',
	};

	const user = await getActorUser(actor);

	if (user) {
		const username = user.username || actorUsername;

		return {
			...data,
			name: user.name || user.username || user.freeSwitchExtension || data.name,
			...(username && { avatarUrl: getUserAvatarURL(username) }),
		};
	}

	return {
		...data,
		...(actorUsername && { avatarUrl: getUserAvatarURL(actorUsername) }),
	};
}

async function sendVoipPushNotificationAsync(callId: IMediaCall['_id'], event: VoipPushNotificationEventType): Promise<void> {
	const call = await MediaCalls.findOneById(callId);
	if (!call) {
		logger.error({ msg: 'Failed to send push notification: Media Call not found', callId });
		return;
	}

	if (call.callee.type !== 'user') {
		logger.error({ msg: 'Failed to send push notification: Invalid Callee Type', callId });
		return;
	}

	// If the call was accepted, we don't need to notify when it ends
	if (call.acceptedAt && event !== 'answer') {
		return;
	}

	const type = getPushNotificationType(call);
	// If the state changed before we had a chance to send the incoming call, skip it altogether
	if (event === 'new' && type !== 'incoming_call') {
		return;
	}
	if (type === 'incoming_call' && event !== 'new') {
		return;
	}

	const { id: userId, username } = call.callee;
	const caller = await getActorUserData(call.caller);

	metrics.notificationsSent.inc({ notification_type: 'mobile' });
	await Push.send({
		useVoipToken: type === 'incoming_call',
		priority: 10,
		payload: {
			host: Meteor.absoluteUrl(),
			hostName: settings.get<string>('Site_Name'),
			notificationType: 'voip',
			type,
			callId: call._id,
			caller,
			username,
			createdAt: call.createdAt.toISOString(),
		},
		userId,
		notId: PushNotification.getNotificationId(call._id),
		// We should not send state change notifications to the device where the call was accepted/rejected
		...(call.callee.contractId && { skipTokenId: call.callee.contractId }),
	});
}

export function sendVoipPushNotification(callId: IMediaCall['_id'], event: VoipPushNotificationEventType): void {
	void sendVoipPushNotificationAsync(callId, event).catch((err) => {
		logger.error({ msg: 'Failed to send VoIP push notification', err, callId, event });
	});
}
