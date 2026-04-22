import type { IMedsensePharmacy } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IMedsensePharmaciesModel extends IBaseModel<IMedsensePharmacy> {
	findOneBySlug(slug: string, options?: any): Promise<IMedsensePharmacy | null>;
	findOneByVoiceInboundNumber(voiceInboundNumber: string, options?: any): Promise<IMedsensePharmacy | null>;
	create(data: Omit<IMedsensePharmacy, '_id' | 'createdAt' | 'updatedAt'>): Promise<any>;
}
