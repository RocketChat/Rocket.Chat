import type { IUser } from '@rocket.chat/core-typings';

export interface IOmnichannelAgent extends IUser {
	statusLivechat: OmnichannelAgentStatus;
}

export type OmnichannelAgentStatus = 'available' | 'not-available';
