import type { ILivechatContact, ILivechatVisitor } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export type VerifyContactChannelParams = {
	contactId: string;
	field: string;
	value: string;
	visitorId: ILivechatVisitor['_id'];
	roomId: string;
};

export const verifyContactChannel = makeFunction(async (_params: VerifyContactChannelParams): Promise<ILivechatContact | null> => null);
