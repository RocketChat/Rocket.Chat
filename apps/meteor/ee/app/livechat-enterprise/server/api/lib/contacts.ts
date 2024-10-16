import type { ILivechatContact, IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatRooms, LivechatVisitors } from '@rocket.chat/models';

import { Livechat } from '../../../../../../app/livechat/server/lib/LivechatTyped';
import { i18n } from '../../../../../../server/lib/i18n';

export async function changeContactBlockStatus({ contactId, block, visitorId }: { contactId: string; visitorId: string; block: boolean }) {
	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'channels'>>(contactId, {
		projection: { channels: 1 },
	});

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	if (!contact.channels) {
		throw new Error('error-contact-has-no-channels');
	}

	const channelIndex = contact.channels?.findIndex((channel) => channel.visitorId === visitorId);

	if (channelIndex === -1) {
		throw new Error('error-channel-not-found');
	}

	contact.channels[channelIndex].blocked = block;

	await LivechatContacts.updateOne({ _id: contactId }, { $set: { channels: contact.channels } });
}

export function hasSingleContactLicense() {
	if (!License.hasModule('contact-id-verification')) {
		throw new Error('error-action-not-allowed');
	}
}

export async function closeBlockedRoom(visitorId: string, user: IUser) {
	const visitor = await LivechatVisitors.findOneById(visitorId);

	if (!visitor) {
		throw new Error('error-visitor-not-found');
	}

	const room = await LivechatRooms.findOneOpenByVisitorToken(visitor.token);

	if (!room) {
		return;
	}

	await Livechat.closeRoom({ room, visitor, comment: i18n.t('close-blocked-room-comment'), user });
}
