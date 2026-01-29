import type { IMedsensePharmacyInvite } from '@rocket.chat/core-typings';
import type { IBaseModel } from './IBaseModel';

export interface IMedsensePharmacyInvitesModel extends IBaseModel<IMedsensePharmacyInvite> {
    createInvite(invite: Omit<IMedsensePharmacyInvite, '_id' | '_updatedAt'>): Promise<string>;
    findPendingByPharmacy(pharmacyId: string): Promise<IMedsensePharmacyInvite[]>;
    findAllByPharmacy(pharmacyId: string): Promise<IMedsensePharmacyInvite[]>;
    findOneByCode(code: string): Promise<IMedsensePharmacyInvite | null>;
    findPendingByPhoneAndPharmacy(phone: string, pharmacyId: string): Promise<IMedsensePharmacyInvite | null>;
    updateStatus(inviteId: string, status: IMedsensePharmacyInvite['status'], extra?: Partial<IMedsensePharmacyInvite>): Promise<void>;
}
