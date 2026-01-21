import type { IMedsenseAudit } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IMedsenseAuditModel extends IBaseModel<IMedsenseAudit> {
    create(data: Omit<IMedsenseAudit, '_id'>): Promise<string>;
}
