import type { IMediaCallNegotiation } from '@rocket.chat/core-typings';
import type { Document, FindOptions, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMediaCallNegotiationsModel extends IBaseModel<IMediaCallNegotiation> {
	findLatestByCallId<T extends Document = IMediaCallNegotiation>(
		callId: IMediaCallNegotiation['callId'],
		options?: FindOptions<T>,
	): Promise<T | null>;
	setOfferById(id: string, offer: RTCSessionDescriptionInit): Promise<UpdateResult>;
	setAnswerById(id: string, answer: RTCSessionDescriptionInit): Promise<UpdateResult>;
	setStableById(id: string): Promise<UpdateResult>;
}
