import type { IOmnichannelRoom, IOmnichannelSource } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const isAgentAvailableToTakeContactInquiry = makeFunction(
	async (_source: IOmnichannelSource, _roomId: IOmnichannelRoom['_id']): Promise<{ error: string; value: false } | { value: true }> => ({
		value: true,
	}),
);
