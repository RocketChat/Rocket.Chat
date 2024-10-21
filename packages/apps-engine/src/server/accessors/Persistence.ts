import type { IPersistence } from '../../definition/accessors';
import type { RocketChatAssociationRecord } from '../../definition/metadata';
import type { PersistenceBridge } from '../bridges/PersistenceBridge';

export class Persistence implements IPersistence {
    constructor(private persistBridge: PersistenceBridge, private appId: string) {}

    public create(data: object): Promise<string> {
        return this.persistBridge.doCreate(data, this.appId);
    }

    public createWithAssociation(data: object, association: RocketChatAssociationRecord): Promise<string> {
        return this.persistBridge.doCreateWithAssociations(data, new Array(association), this.appId);
    }

    public createWithAssociations(data: object, associations: Array<RocketChatAssociationRecord>): Promise<string> {
        return this.persistBridge.doCreateWithAssociations(data, associations, this.appId);
    }

    public update(id: string, data: object, upsert = false): Promise<string> {
        return this.persistBridge.doUpdate(id, data, upsert, this.appId);
    }

    public updateByAssociation(association: RocketChatAssociationRecord, data: object, upsert = false): Promise<string> {
        return this.persistBridge.doUpdateByAssociations(new Array(association), data, upsert, this.appId);
    }

    public updateByAssociations(associations: Array<RocketChatAssociationRecord>, data: object, upsert = false): Promise<string> {
        return this.persistBridge.doUpdateByAssociations(associations, data, upsert, this.appId);
    }

    public remove(id: string): Promise<object> {
        return this.persistBridge.doRemove(id, this.appId);
    }

    public removeByAssociation(association: RocketChatAssociationRecord): Promise<Array<object>> {
        return this.persistBridge.doRemoveByAssociations(new Array(association), this.appId);
    }

    public removeByAssociations(associations: Array<RocketChatAssociationRecord>): Promise<Array<object>> {
        return this.persistBridge.doRemoveByAssociations(associations, this.appId);
    }
}
