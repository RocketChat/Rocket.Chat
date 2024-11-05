import type { ILivechatContact, ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

export async function getContactIdByVisitor(visitor: ILivechatContactVisitorAssociation): Promise<ILivechatContact['_id'] | null> {
	const contact = await LivechatContacts.findOneByVisitor<Pick<ILivechatContact, '_id'>>(visitor, { projection: { _id: 1 } });
	if (!contact) {
		return null;
	}
	return contact._id;
}
