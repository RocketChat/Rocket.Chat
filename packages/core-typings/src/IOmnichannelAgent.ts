import type { IUser } from './IUser';

export interface IOmnichannelAgent extends IUser {
	statusLivechat: OmnichannelAgentStatus;
}

export type OmnichannelAgentStatus = 'available' | 'not-available';
