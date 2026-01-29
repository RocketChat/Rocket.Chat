import type { IMedsensePharmacyInvite } from '@rocket.chat/core-typings';
import type { IMedsensePharmacyInvitesModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsensePharmacyInvitesRaw extends BaseRaw<IMedsensePharmacyInvite> implements IMedsensePharmacyInvitesModel {
    constructor(db: Db) {
        super(db, 'medsense_pharmacy_invites');
    }

    protected override modelIndexes(): IndexDescription[] {
        return [
            { key: { pharmacyId: 1, phone: 1, status: 1 } },
            { key: { phone: 1 } },
            // Removed TTL index to persist history
            { key: { code: 1 } },
        ];
    }

    async createInvite(invite: Omit<IMedsensePharmacyInvite, '_id' | '_updatedAt'>): Promise<string> {
        const result = await this.insertOne({
            ...invite,
            _updatedAt: new Date(),
        });
        return result.insertedId;
    }

    async findPendingByPharmacy(pharmacyId: string): Promise<IMedsensePharmacyInvite[]> {
        return this.find({ pharmacyId, status: 'pending' }).toArray();
    }

    async findAllByPharmacy(pharmacyId: string): Promise<IMedsensePharmacyInvite[]> {
        return this.find({ pharmacyId }, { sort: { createdAt: -1 } }).toArray();
    }

    async findOneByCode(code: string): Promise<IMedsensePharmacyInvite | null> {
        // Only return pending invites. And make sure not expired (though TTL handles cleanup, safe to check)
        return this.findOne({ code, status: 'pending', expiresAt: { $gt: new Date() } });
    }

    async findPendingByPhoneAndPharmacy(phone: string, pharmacyId: string): Promise<IMedsensePharmacyInvite | null> {
        return this.findOne({ phone, pharmacyId, status: 'pending' });
    }

    async updateStatus(inviteId: string, status: IMedsensePharmacyInvite['status'], extra?: Partial<IMedsensePharmacyInvite>): Promise<void> {
        const update: any = {
            $set: {
                status,
                _updatedAt: new Date(),
                ...extra
            }
        };
        await this.updateOne({ _id: inviteId }, update);
    }
}
