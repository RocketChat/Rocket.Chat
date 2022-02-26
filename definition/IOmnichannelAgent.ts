import { IUser } from './IUser';

export interface IOmnichannelAgent extends IUser {
	statusLivechat: OmnichannelAgentStatus;
	statusVoip?: OmnichannelAgentStatus;
}

export type OmnichannelAgentStatus = 'available' | 'not-available';
