
import type { IMedsenseInterventionNote } from '@rocket.chat/core-typings';
import type { IMedsenseInterventionNotesModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsenseInterventionNotesRaw extends BaseRaw<IMedsenseInterventionNote> implements IMedsenseInterventionNotesModel {
    constructor(db: Db) {
        super(db, 'medsense_intervention_notes');
    }

    protected override modelIndexes(): IndexDescription[] {
        return [
            { key: { interventionId: 1, createdAt: -1 } },
        ];
    }

    findByInterventionId(interventionId: string): FindCursor<IMedsenseInterventionNote> {
        return this.find({ interventionId }, { sort: { createdAt: 1 } });
    }

    async createNote(data: Omit<IMedsenseInterventionNote, '_id' | '_updatedAt'>): Promise<string> {
        const result = await this.insertOne({
            ...data,
            _updatedAt: new Date(),
        });
        return result.insertedId;
    }
}
