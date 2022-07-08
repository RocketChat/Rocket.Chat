import type { UpdateResult } from 'mongodb';
import type { IInvite } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IInvitesModel extends IBaseModel<IInvite> {
	findOneByUserRoomMaxUsesAndExpiration(userId: string, rid: string, maxUses: number, daysToExpire: number): Promise<IInvite | null>;
	increaseUsageById(_id: string, uses: number): Promise<UpdateResult>;
	countUses(): Promise<number>;
}
