import { IRocketChatRecord } from '../IRocketChatRecord';

export type VoipEventName = 'QUEUECALLERJOIN' | 'AGENTCALLED' | 'AGENTCONNECT';

export interface IQueueCountData {
	callwaitingcount: string;
}
export interface IVoipEvent extends IRocketChatRecord {
	event: string;
	objectname: string;
	eventdata: IQueueCountData | undefined;
}
