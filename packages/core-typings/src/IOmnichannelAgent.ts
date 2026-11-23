import type { IUser } from './IUser.js';

export interface IOmnichannelAgent extends IUser {
	statusLivechat: OmnichannelAgentStatus;
}

export type OmnichannelAgentStatus = 'available' | 'not-available';
