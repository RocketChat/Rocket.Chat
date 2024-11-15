import type { IPersistenceRead } from '../../definition/accessors';
import type { RocketChatAssociationRecord } from '../../definition/metadata';
import type { PersistenceBridge } from '../bridges';
export declare class PersistenceRead implements IPersistenceRead {
    private persistBridge;
    private appId;
    constructor(persistBridge: PersistenceBridge, appId: string);
    read(id: string): Promise<object>;
    readByAssociation(association: RocketChatAssociationRecord): Promise<Array<object>>;
    readByAssociations(associations: Array<RocketChatAssociationRecord>): Promise<Array<object>>;
}
