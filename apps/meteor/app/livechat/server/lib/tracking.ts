import { Message } from '@rocket.chat/core-services';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatInquiry, LivechatRooms, Messages, ReadReceipts, Subscriptions, Users } from '@rocket.chat/models';

import { livechatLogger } from './logger';
import { FileUpload } from '../../../file-upload/server';
import { notifyOnSubscriptionChanged, notifyOnLivechatInquiryChanged } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';

type PageInfo = { title: string; location: { href: string }; change: string };

export async function savePageHistory(token: string, roomId: string | undefined, pageInfo: PageInfo) {
	livechatLogger.debug({
		msg: `Saving page movement history for visitor with token ${token}`,
		pageInfo,
		roomId,
	});

	if (pageInfo.change !== settings.get<string>('Livechat_history_monitor_type')) {
		return;
	}
	const user = await Users.findOneById('rocket.cat');

	if (!user) {
		throw new Error('error-invalid-user');
	}

	const pageTitle = pageInfo.title;
	const pageUrl = pageInfo.location.href;
	const extraData: {
		navigation: {
			page: PageInfo;
			token: string;
		};
		expireAt?: number;
		_hidden?: boolean;
	} = {
		navigation: {
			page: pageInfo,
			token,
		},
	};

	if (!roomId) {
		livechatLogger.warn(`Saving page history without room id for visitor with token ${token}`);
		// keep history of unregistered visitors for 1 month
		const keepHistoryMiliseconds = 2592000000;
		extraData.expireAt = new Date().getTime() + keepHistoryMiliseconds;
	}

	if (!settings.get('Livechat_Visitor_navigation_as_a_message')) {
		extraData._hidden = true;
	}

	// @ts-expect-error: Investigating on which case we won't receive a roomId and where that history is supposed to be stored
	return Message.saveSystemMessage('livechat_navigation_history', roomId, `${pageTitle} - ${pageUrl}`, user, extraData);
}

export async function cleanGuestHistory(guest: ILivechatVisitor) {
	const { token } = guest;

	// This shouldn't be possible, but just in case
	if (!token) {
		throw new Error('error-invalid-guest');
	}

	const cursor = LivechatRooms.findByVisitorToken(token);
	for await (const room of cursor) {
		await Promise.all([
			Subscriptions.removeByRoomId(room._id, {
				async onTrash(doc) {
					void notifyOnSubscriptionChanged(doc, 'removed');
				},
			}),
			FileUpload.removeFilesByRoomId(room._id),
			Messages.removeByRoomId(room._id),
			ReadReceipts.removeByRoomId(room._id),
		]);
	}

	await LivechatRooms.removeByVisitorToken(token);

	const livechatInquiries = await LivechatInquiry.findIdsByVisitorToken(token).toArray();
	await LivechatInquiry.removeByIds(livechatInquiries.map(({ _id }) => _id));
	void notifyOnLivechatInquiryChanged(livechatInquiries, 'removed');
}
