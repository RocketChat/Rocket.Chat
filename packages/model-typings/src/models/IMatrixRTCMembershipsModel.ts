import type { IMatrixRTCMembership, IUser, IVideoConference } from '@rocket.chat/core-typings';
import type { FindCursor, UpdateResult } from 'mongodb';

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

	/** Every membership this server announced for one of its users in a conference, whether or not it still counts. */
	findLocalByCallIdAndUid(callId: IVideoConference['_id'], uid: IUser['_id']): FindCursor<IMatrixRTCMembership>;

	/** Every membership this server announced for its users in a conference, whether or not it still counts. */
	findLocalByCallId(callId: IVideoConference['_id']): FindCursor<IMatrixRTCMembership>;

	/** Records that a membership was announced again, by a new event, and counts until `expiresAt`. */
	updateAnnouncementById(
		_id: IMatrixRTCMembership['_id'],
		announcement: Pick<IMatrixRTCMembership, 'eventId' | 'expiresAt'>,
	): Promise<UpdateResult>;
}
