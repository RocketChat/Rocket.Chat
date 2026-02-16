import type { FindCursor } from 'mongodb';
import type { IMedsenseInterventionNote } from '@rocket.chat/core-typings';
import type { IBaseModel } from './IBaseModel';

export interface IMedsenseInterventionNotesModel extends IBaseModel<IMedsenseInterventionNote> {
    findByInterventionId(interventionId: string): FindCursor<IMedsenseInterventionNote>;
    createNote(data: Omit<IMedsenseInterventionNote, '_id' | '_updatedAt'>): Promise<string>;
}
