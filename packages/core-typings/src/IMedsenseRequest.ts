import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IMedsenseRequest extends IRocketChatRecord {
    roomId: string; // The patient-pharmacist room
    pharmacyId: string; // The pharmacy this request belongs to
    requestedByUserId: string;
    requestedByUsername?: string;
    reason: string; // The issue/reason for the request
    status: 'pending' | 'taken' | 'closed'; // Status of the request

    createdAt: Date;
    updatedAt: Date;

    takenBy?: {
        _id: string;
        username: string;
    };
    takenAt?: Date;

    closedBy?: {
        _id: string;
        username: string;
    };
    closedAt?: Date;
}
