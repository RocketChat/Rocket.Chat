import { AsyncTest, Expect, SetupFixture, SpyOn } from 'alsatian';

import { RocketChatAssociationModel, RocketChatAssociationRecord } from '../../../src/definition/metadata';
import { Persistence } from '../../../src/server/accessors';
import type { PersistenceBridge } from '../../../src/server/bridges';

export class PersistenceAccessorTestFixture {
    private mockAppId: string;

    private mockPersisBridge: PersistenceBridge;

    private mockAssoc: RocketChatAssociationRecord;

    private data: object;

    @SetupFixture
    public setupFixture() {
        this.mockAppId = 'testing-app';
        this.data = { hello: 'world' };

        const theData = this.data;
        this.mockPersisBridge = {
            doCreate(data: any, appId: string): Promise<string> {
                return Promise.resolve('id');
            },
            doCreateWithAssociations(data: any, assocs: Array<RocketChatAssociationRecord>, appId: string): Promise<string> {
                return Promise.resolve('id2');
            },
            doUpdate(id: string, data: object, upsert: boolean, appId: string): Promise<string> {
                return Promise.resolve('id3');
            },
            doRemove(id: string, appId: string): Promise<object> {
                return Promise.resolve(theData);
            },
            doRemoveByAssociations(assocs: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object>> {
                return Promise.resolve([theData]);
            },
            doUpdateByAssociations(associations: Array<RocketChatAssociationRecord>, data: object, upsert: boolean, appId: string): Promise<string> {
                return Promise.resolve('id4');
            },
        } as PersistenceBridge;
        this.mockAssoc = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, 'fake-id');
    }

    @AsyncTest()
    public async usePersistenceAccessor() {
        Expect(() => new Persistence(this.mockPersisBridge, this.mockAppId)).not.toThrow();

        const sp1 = SpyOn(this.mockPersisBridge, 'doCreate');
        const sp2 = SpyOn(this.mockPersisBridge, 'doCreateWithAssociations');
        const sp3 = SpyOn(this.mockPersisBridge, 'doUpdate');
        const sp4 = SpyOn(this.mockPersisBridge, 'doRemove');
        const sp5 = SpyOn(this.mockPersisBridge, 'doRemoveByAssociations');
        const sp6 = SpyOn(this.mockPersisBridge, 'doUpdateByAssociations');

        const ps = new Persistence(this.mockPersisBridge, this.mockAppId);

        Expect(await ps.create(this.data)).toBe('id');
        Expect(this.mockPersisBridge.doCreate).toHaveBeenCalledWith(this.data, this.mockAppId);
        Expect(await ps.createWithAssociation(this.data, this.mockAssoc)).toBe('id2');
        Expect(await ps.createWithAssociations(this.data, [this.mockAssoc])).toBe('id2');
        Expect(this.mockPersisBridge.doCreateWithAssociations).toHaveBeenCalled().exactly(2);
        Expect(await ps.update('id', this.data)).toBe('id3');
        Expect(this.mockPersisBridge.doUpdate).toHaveBeenCalledWith('id', this.data, false, this.mockAppId);
        Expect(await ps.remove('id')).toEqual(this.data);
        Expect(this.mockPersisBridge.doRemove).toHaveBeenCalledWith('id', this.mockAppId);
        Expect(await ps.removeByAssociation(this.mockAssoc)).toBeDefined();
        Expect(await ps.removeByAssociations([this.mockAssoc])).toBeDefined();
        Expect(this.mockPersisBridge.doRemoveByAssociations).toHaveBeenCalled().exactly(2);

        Expect(await ps.updateByAssociation(this.mockAssoc, this.data)).toBeDefined();
        Expect(await ps.updateByAssociations([this.mockAssoc], this.data)).toBeDefined();
        Expect(this.mockPersisBridge.doUpdateByAssociations).toHaveBeenCalled().exactly(2);

        sp1.restore();
        sp2.restore();
        sp3.restore();
        sp4.restore();
        sp5.restore();
        sp6.restore();
    }
}
