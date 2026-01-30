import type { IOmnichannelAgent } from '@rocket.chat/core-typings';

export type TriggerMessage = {
	msg?: string;
	token: string;
	u: Serialized<IOmnichannelAgent>;
	ts: string;
	_id: string;
	trigger: boolean;
};
