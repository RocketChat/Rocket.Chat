import type { UpdateWriteOpResult } from 'mongodb';
import type { IInvite } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IInvitesModel extends IBaseModel<IInvite> {
	findOneByUserRoomMaxUsesAndExpiration(userId: string, rid: string, maxUses: number, daysToExpire: number): Promise<IInvite | null>;
	increaseUsageById(_id: string, uses: number): Promise<UpdateWriteOpResult>;
	countUses(): Promise<number>;
}
