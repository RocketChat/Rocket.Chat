import type { ILivechatVisitor, IOmnichannelRoom, IOmnichannelSource } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const shouldTriggerVerificationApp = makeFunction(
	async (_visitorId: ILivechatVisitor['_id'], _roomId: IOmnichannelRoom['_id'], _source: IOmnichannelSource): Promise<boolean> => false,
);
