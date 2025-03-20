import type { IUser, IRoom } from '@rocket.chat/core-typings';

type WorkDetails = {
	rid: IRoom['_id'];
	userId: IUser['_id'];
};

type WorkDetailsWithSource = WorkDetails & {
	from: string;
};

export interface IOmnichannelTranscriptService {
	workOnPdf({ details }: { details: WorkDetailsWithSource }): Promise<void>;
}
