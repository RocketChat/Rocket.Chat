import type { ILivechatContact, ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const mergeContacts = makeFunction(
	async (_contactId: string, _visitor: ILivechatContactVisitorAssociation): Promise<ILivechatContact | null> => null,
);
