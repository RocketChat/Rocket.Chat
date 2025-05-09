import { AsyncTest, Expect, SetupFixture } from 'alsatian';

import type { RocketChatAssociationRecord } from '../../../src/definition/metadata';
import { PersistenceRead } from '../../../src/server/accessors';
import type { PersistenceBridge } from '../../../src/server/bridges';

export class PersistenceReadTestFixture {
    private mockPersisBridge: PersistenceBridge;

    @SetupFixture
    public setupFixture() {
        this.mockPersisBridge = {
            doReadById(id: string, appId: string): Promise<object> {
                return Promise.resolve({ id, appId });
            },
            doReadByAssociations(assocs: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object>> {
                return Promise.resolve([{ appId }]);
            },
        } as PersistenceBridge;
    }

    @AsyncTest()
    public async usePersistenceRead() {
        Expect(() => new PersistenceRead(this.mockPersisBridge, 'testing')).not.toThrow();

        const pr = new PersistenceRead(this.mockPersisBridge, 'testing');
        Expect(await pr.read('thing')).toBeDefined();
        Expect(await pr.readByAssociation({} as RocketChatAssociationRecord)).toBeDefined();
        Expect(await pr.readByAssociations([{} as RocketChatAssociationRecord])).toBeDefined();
    }
}
