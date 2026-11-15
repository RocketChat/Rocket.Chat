import type { IMediaCallNegotiation, MediaCallNegotiationStream, RTCSessionDescriptionInit } from '@rocket.chat/core-typings';
import type { Document, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IMediaCallNegotiationsModel extends IBaseModel<IMediaCallNegotiation> {
	findLatestByCallId<T extends Document = IMediaCallNegotiation, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		callId: IMediaCallNegotiation['callId'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	setOfferById(id: string, offer: RTCSessionDescriptionInit, offerStreams?: MediaCallNegotiationStream[]): Promise<UpdateResult>;
	setAnswerById(id: string, answer: RTCSessionDescriptionInit, answerStreams?: MediaCallNegotiationStream[]): Promise<UpdateResult>;
	setStableById(id: string): Promise<UpdateResult>;
}
