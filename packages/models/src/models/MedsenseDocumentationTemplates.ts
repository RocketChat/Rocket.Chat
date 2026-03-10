import type { IMedsenseDocumentationTemplate } from '@rocket.chat/core-typings';
import type { IMedsenseDocumentationTemplatesModel } from '@rocket.chat/model-typings';
import type { Db, Document, FindCursor, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsenseDocumentationTemplatesRaw extends BaseRaw<IMedsenseDocumentationTemplate> implements IMedsenseDocumentationTemplatesModel {
    constructor(db: Db) {
        super(db, 'medsense_documentation_templates');
    }

    protected override modelIndexes(): IndexDescription[] {
        return [
            { key: { status: 1 } },
            { key: { key: 1 }, unique: true },
            { key: { interventionTypes: 1 } },
            { key: { specialtyActionIds: 1 } },
        ];
    }

    findByStatus(status: IMedsenseDocumentationTemplate['status']): FindCursor<IMedsenseDocumentationTemplate> {
        return this.find({ status }, { sort: { createdAt: -1 } });
    }

    findByInterventionType(interventionType: string): FindCursor<IMedsenseDocumentationTemplate> {
        return this.find(
            { $or: [{ interventionTypes: interventionType }, { interventionTypes: { $exists: false } }, { interventionTypes: { $size: 0 } }] },
            { sort: { createdAt: -1 } },
        );
    }

    async findActiveByInterventionType(interventionType: string): Promise<IMedsenseDocumentationTemplate[]> {
        return this.find(
            { status: 'active', $or: [{ interventionTypes: interventionType }, { interventionTypes: { $exists: false } }, { interventionTypes: { $size: 0 } }] },
            { sort: { createdAt: -1 } },
        ).toArray();
    }

    findBySpecialtyActionId(specialtyActionId: string): FindCursor<IMedsenseDocumentationTemplate> {
        return this.find({ specialtyActionIds: specialtyActionId }, { sort: { createdAt: -1 } });
    }

    async findActiveBySpecialtyActionId(specialtyActionId: string): Promise<IMedsenseDocumentationTemplate | null> {
        return this.findOne({ specialtyActionIds: specialtyActionId, status: 'active' });
    }

    async deactivateOtherTemplates(specialtyActionId: string, currentTemplateId: string): Promise<UpdateResult | Document> {
        return this.updateMany(
            {
                specialtyActionIds: specialtyActionId,
                _id: { $ne: currentTemplateId },
                status: 'active',
            },
            {
                $set: {
                    status: 'inactive',
                    _updatedAt: new Date(),
                },
            },
        );
    }
}
