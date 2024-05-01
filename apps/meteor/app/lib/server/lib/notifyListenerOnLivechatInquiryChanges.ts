import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { LivechatInquiry } from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

export async function notifyListenerOnLivechatInquiryChanges(
	inquiryId: ILivechatInquiryRecord['_id'],
	clientAction: ClientAction = 'updated',
	existingInquiryData?: ILivechatInquiryRecord,
	args?: Partial<ILivechatInquiryRecord>,
): Promise<void> {
	if (!dbWatchersDisabled) return;

	const inquiry = existingInquiryData || (await LivechatInquiry.findOneById(inquiryId));

	if (inquiry) {
		void api.broadcast('watch.inquiries', { clientAction, inquiry: { ...inquiry, ...args } });
	}
}

export async function notifyListenerOnLivechatInquiryChangesByToken(
	token: ILivechatInquiryRecord['v']['token'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) return;

	const inquiries = await LivechatInquiry.find({ 'v.token': token }).toArray();

	for (const inquiry of inquiries) {
		void notifyListenerOnLivechatInquiryChanges(inquiry._id, clientAction, inquiry);
	}
}

export async function notifyListenerOnLivechatInquiryChangesByRoomId(
	roomId: ILivechatInquiryRecord['rid'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (!dbWatchersDisabled) return;

	const inquiry = await LivechatInquiry.findOne({ rid: roomId });

	if (inquiry) {
		return notifyListenerOnLivechatInquiryChanges(inquiry._id, clientAction, inquiry);
	}
}
