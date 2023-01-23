import type { IUser, IRoom } from '@rocket.chat/core-typings';

export interface IOmnichannelTranscriptService {
	requestTranscript({ details }: { details: { userId: IUser['_id']; rid: IRoom['_id'] } }): Promise<void>;
	workOnPdf({ template, details }: { template: string; details: any }): Promise<void>;
}
