import type { IMedsenseAudit } from '@rocket.chat/core-typings';
import type { IMedsenseAuditModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsenseAuditRaw extends BaseRaw<IMedsenseAudit> implements IMedsenseAuditModel {
    constructor(db: Db) {
        super(db, 'medsense_audit');
    }

    protected override modelIndexes(): IndexDescription[] {
        return [
            { key: { roomId: 1 } },
            { key: { teamId: 1 } },
            { key: { pharmacyId: 1 } },
            { key: { patientUserId: 1 } },
            { key: { takenBy: 1 } },
            { key: { at: -1 } },
        ];
    }

    create(data: Omit<IMedsenseAudit, '_id'>) {
        return this.insertOne(data).then((result) => result.insertedId);
    }
}
