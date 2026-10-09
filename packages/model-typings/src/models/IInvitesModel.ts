import type { IInvite, IInviteSummary } from '@rocket.chat/core-typings';
import type { ClientSession, FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IInvitesModel extends IBaseModel<IInvite> {
	findOneByUserRoomMaxUsesAndExpiration(userId: string, rid: string, maxUses: number, daysToExpire: number): Promise<IInvite | null>;
	findOneByInviteToken(inviteToken: string): Promise<IInvite | null>;
	increaseUsageById(_id: string, uses: number): Promise<UpdateResult>;
	countUses(): Promise<number>;
	findInvitesForManagement(): FindCursor<IInviteSummary>;
	migrateLegacyInvites(ids: string[], expiresAt: Date, session: ClientSession): Promise<void>;
}
