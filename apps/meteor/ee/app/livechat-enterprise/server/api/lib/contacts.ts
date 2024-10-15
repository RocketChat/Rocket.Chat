import type { ILivechatContact } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatRooms, LivechatVisitors } from '@rocket.chat/models';

import { Livechat } from '../../../../../../app/livechat/server/lib/LivechatTyped';
import { i18n } from '../../../../../../server/lib/i18n';

export async function changeContactBlockStatus({ contactId, block, visitorId }: { contactId: string; visitorId: string; block: boolean }) {
	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'channels'>>(contactId, {
		projection: { _id: 1, channels: 1 },
	});

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	const channel = contact.channels?.find((channel) => channel.visitorId === visitorId);

	if (!channel) {
		throw new Error('error-channel-not-found');
	}

	channel.blocked = block;

	await LivechatContacts.updateOne({ _id: contactId }, { $set: { channels: contact.channels } });
}

export async function hasSingleContactLicense() {
	if (!License.hasModule('chat.rocket.contact-id-verification')) {
		throw new Meteor.Error('error-action-not-allowed', 'This is an enterprise feature');
	}
}

export async function closeBlockedRoom(visitorId: string) {
	const visitor = await LivechatVisitors.findOneById(visitorId);

	if (!visitor) {
		throw new Error('error-visitor-not-found');
	}

	const room = await LivechatRooms.findOneOpenByVisitorToken(visitor.token);

	if (!room) {
		return;
	}

	await Livechat.closeRoom({ room, visitor, comment: i18n.t('close-blocked-room-comment') });
}
