import type { IMatrixRTCMembership, IUser, IVideoConference } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMatrixRTCMembershipsModel extends IBaseModel<IMatrixRTCMembership> {
	/** The memberships of one session that still count at `now`. */
	findActiveBySession(mrid: string, slotId: string, now?: Date): FindCursor<IMatrixRTCMembership>;

	/** The memberships attached to one conference that still count at `now`. */
	findActiveByCallId(callId: IVideoConference['_id'], now?: Date): FindCursor<IMatrixRTCMembership>;

	/** The membership this server announced for one of its users in a conference, if it still counts. */
	findOneActiveLocal(callId: IVideoConference['_id'], uid: IUser['_id'], now?: Date): Promise<IMatrixRTCMembership | null>;

	/** Memberships past their expiry that are still on record. */
	findExpired(now?: Date): FindCursor<IMatrixRTCMembership>;
}
