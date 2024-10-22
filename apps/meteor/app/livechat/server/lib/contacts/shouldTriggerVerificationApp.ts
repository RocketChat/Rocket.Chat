import type { ILivechatContact, IOmnichannelSource } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const shouldTriggerVerificationApp = makeFunction(
	async (_contactId: ILivechatContact['_id'], _source: IOmnichannelSource): Promise<boolean> => false,
);
