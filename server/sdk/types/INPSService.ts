import { IUser } from '../../../definition/IUser';

export type NPSVotePayload = {
	userId: string;
	npsId: string;
	roles: string[];
	score: number;
	comment: string;
};

export type NPSCreatePayload = {
	npsId: string;
	startAt: Date;
	expireAt: Date;
	createdBy: Pick<IUser, '_id' | 'username'>;
};
export interface INPSService {
	create(nps: NPSCreatePayload): Promise<boolean>;
	vote(vote: NPSVotePayload): Promise<void>;
	sendResults(): Promise<void>;
	closeOpenSurveys(): Promise<void>;
}
