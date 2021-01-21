import { INpsVote } from '../../../definition/INps';
import { IUser } from '../../../definition/IUser';

export interface INPSService {
	create(nps: { npsId: string; startAt: Date; expireAt: Date; createdBy: Pick<IUser, '_id' | 'username'> }): Promise<boolean>;
	vote(vote: Omit<INpsVote, '_id'>): Promise<boolean>;
	endSurveys(): Promise<void>;
	sendResults(npsId: string): Promise<boolean>;
}
