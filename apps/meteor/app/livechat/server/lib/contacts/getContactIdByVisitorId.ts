import type { ILivechatContact, ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

export async function getContactIdByVisitorId(visitorId: ILivechatVisitor['_id']): Promise<ILivechatContact['_id'] | null> {
	const contact = await LivechatContacts.findOneByVisitorId<Pick<ILivechatContact, '_id'>>(visitorId, { projection: { _id: 1 } });
	if (!contact) {
		return null;
	}
	return contact._id;
}
