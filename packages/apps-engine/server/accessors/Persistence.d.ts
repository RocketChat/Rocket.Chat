import type { IPersistence } from '../../definition/accessors';
import type { RocketChatAssociationRecord } from '../../definition/metadata';
import type { PersistenceBridge } from '../bridges/PersistenceBridge';
export declare class Persistence implements IPersistence {
    private persistBridge;
    private appId;
    constructor(persistBridge: PersistenceBridge, appId: string);
    create(data: object): Promise<string>;
    createWithAssociation(data: object, association: RocketChatAssociationRecord): Promise<string>;
    createWithAssociations(data: object, associations: Array<RocketChatAssociationRecord>): Promise<string>;
    update(id: string, data: object, upsert?: boolean): Promise<string>;
    updateByAssociation(association: RocketChatAssociationRecord, data: object, upsert?: boolean): Promise<string>;
    updateByAssociations(associations: Array<RocketChatAssociationRecord>, data: object, upsert?: boolean): Promise<string>;
    remove(id: string): Promise<object>;
    removeByAssociation(association: RocketChatAssociationRecord): Promise<Array<object>>;
    removeByAssociations(associations: Array<RocketChatAssociationRecord>): Promise<Array<object>>;
}
