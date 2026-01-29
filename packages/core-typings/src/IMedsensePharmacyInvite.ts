import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IMedsensePharmacyInvite extends IRocketChatRecord {
    pharmacyId: string;
    phone: string; // E.164
    role: 'staff' | 'tech' | 'pharmacist' | 'manager';
    code: string; // 6 digits
    expiresAt: Date;
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
    sendCount: number;
    active: boolean; // redundancy for quick check

    name?: string | null;
    email?: string | null;

    createdBy: string; // userId
    createdAt: Date;

    lastSentAt?: Date;

    acceptedBy?: string; // userId
    acceptedAt?: Date;

    _updatedAt: Date;
}
