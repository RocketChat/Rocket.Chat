import type { Document, FindCursor, UpdateResult } from 'mongodb';
import type { IMedsenseDocumentationTemplate } from '@rocket.chat/core-typings';
import type { IBaseModel } from './IBaseModel';

export interface IMedsenseDocumentationTemplatesModel extends IBaseModel<IMedsenseDocumentationTemplate> {
    findByStatus(status: IMedsenseDocumentationTemplate['status']): FindCursor<IMedsenseDocumentationTemplate>;
    findByInterventionType(interventionType: string): FindCursor<IMedsenseDocumentationTemplate>;
    findActiveByInterventionType(interventionType: string): Promise<IMedsenseDocumentationTemplate[]>;
    findBySpecialtyActionId(specialtyActionId: string): FindCursor<IMedsenseDocumentationTemplate>;
    findActiveBySpecialtyActionId(specialtyActionId: string): Promise<IMedsenseDocumentationTemplate | null>;
    deactivateOtherTemplates(specialtyActionId: string, currentTemplateId: string): Promise<UpdateResult | Document>;
}
