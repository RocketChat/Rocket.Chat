import type { IUser, ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatRooms, LivechatVisitors } from '@rocket.chat/models';

import { closeRoom } from '../../../../../../app/livechat/server/lib/closeRoom';
import { i18n } from '../../../../../../server/lib/i18n';

export async function changeContactBlockStatus({ block, visitor }: { visitor: ILivechatContactVisitorAssociation; block: boolean }) {
	const result = await LivechatContacts.setChannelBlockStatus(visitor, block);

	if (!result.modifiedCount) {
		throw new Error('error-contact-not-found');
	}
}

export function ensureSingleContactLicense() {
	if (!License.hasModule('contact-id-verification')) {
		throw new Error('error-action-not-allowed');
	}
}

export async function closeBlockedRoom(association: ILivechatContactVisitorAssociation, user: IUser) {
	const visitor = await LivechatVisitors.findOneById(association.visitorId);

	if (!visitor) {
		throw new Error('error-visitor-not-found');
	}

	const room = await LivechatRooms.findOneOpenByContactChannelVisitor(association);

	if (!room) {
		return;
	}

	return closeRoom({ room, visitor, comment: i18n.t('close-blocked-room-comment'), user });
}
