import type { ILivechatContact, IOmnichannelSource } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const isAgentAvailableToTakeContactInquiry = makeFunction(
	async (
		_source: IOmnichannelSource,
		_contactId: ILivechatContact['_id'] | null,
	): Promise<{ error: string; value: false } | { value: true }> => ({
		value: true,
	}),
);
