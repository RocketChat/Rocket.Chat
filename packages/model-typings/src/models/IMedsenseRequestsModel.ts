import type { FindCursor, UpdateResult, Document } from 'mongodb';
import type { IMedsenseRequest } from '@rocket.chat/core-typings';
import type { IBaseModel } from './IBaseModel';

export interface IMedsenseRequestsModel extends IBaseModel<IMedsenseRequest> {
    findPendingByPharmacyId(pharmacyId: string): FindCursor<IMedsenseRequest>;
    findTakenByPharmacyId(pharmacyId: string): FindCursor<IMedsenseRequest>;
    findClosedByPharmacyId(pharmacyId: string, limit?: number): FindCursor<IMedsenseRequest>;
    createRequest(data: Omit<IMedsenseRequest, '_id' | '_updatedAt'>): Promise<string>;
    markTaken(requestId: string, userId: string, username: string): Promise<UpdateResult | Document>;
    markClosed(requestId: string, userId: string, username: string): Promise<UpdateResult | Document>;
    findActiveByRoomId(roomId: string): Promise<IMedsenseRequest | null>;
}
