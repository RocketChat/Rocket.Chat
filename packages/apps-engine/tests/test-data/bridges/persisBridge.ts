import type { RocketChatAssociationRecord } from '../../../src/definition/metadata';
import { PersistenceBridge } from '../../../src/server/bridges';

export class TestsPersisBridge extends PersistenceBridge {
    public purge(appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public create(data: any, appId: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    public createWithAssociations(data: object, associations: Array<RocketChatAssociationRecord>, appId: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    public readById(id: string, appId: string): Promise<object> {
        throw new Error('Method not implemented.');
    }

    public readByAssociations(associations: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object>> {
        throw new Error('Method not implemented.');
    }

    public remove(id: string, appId: string): Promise<object> {
        throw new Error('Method not implemented.');
    }

    public removeByAssociations(associations: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object>> {
        throw new Error('Method not implemented.');
    }

    public update(id: string, data: object, upsert: boolean, appId: string): Promise<string> {
        throw new Error('Method not implemented.');
    }

    public updateByAssociations(associations: Array<RocketChatAssociationRecord>, data: object, upsert: boolean, appId: string): Promise<string> {
        throw new Error('Method not implemented');
    }
}
