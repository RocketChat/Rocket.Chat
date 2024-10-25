import type { ILivechatContact, IOmnichannelSource } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const isAgentAvailableToTakeContactInquiry = makeFunction(
	async (_contactId: ILivechatContact['_id'], _source: IOmnichannelSource) => true,
);
