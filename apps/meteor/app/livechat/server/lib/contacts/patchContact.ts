import type { ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

export const patchContact = async (
	contactId: ILivechatContact['_id'],
	data: { set?: Partial<ILivechatContact>; unset?: Array<keyof ILivechatContact> },
): Promise<ILivechatContact | null> => {
	const { set = {}, unset = [] } = data;

	if (Object.keys(set).length === 0 && unset.length === 0) {
		return LivechatContacts.findOneEnabledById(contactId);
	}
	return LivechatContacts.patchContact(contactId, data);
};
