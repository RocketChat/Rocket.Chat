import type { IRoom, IUser } from '@rocket.chat/core-typings';

export const isPromiseRejectedResult = (result: any): result is PromiseRejectedResult => result.status === 'rejected';

export type WorkDetails = {
	rid: IRoom['_id'];
	userId: IUser['_id'];
};

export type WorkDetailsWithSource = WorkDetails & {
	from: string;
};
