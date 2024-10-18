import type { IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatRooms, LivechatVisitors } from '@rocket.chat/models';

import { Livechat } from '../../../../../../app/livechat/server/lib/LivechatTyped';
import { i18n } from '../../../../../../server/lib/i18n';

export async function changeContactBlockStatus({ block, visitorId }: { visitorId: string; block: boolean }) {
	const result = await LivechatContacts.updateContactChannel(visitorId, { blocked: block });

	if (!result.modifiedCount) {
		throw new Error('error-contact-not-found');
	}
}

export function ensureSingleContactLicense() {
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

	return Livechat.closeRoom({ room, visitor, comment: i18n.t('close-blocked-room-comment'), user });
}
