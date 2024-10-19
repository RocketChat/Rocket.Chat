import { AsyncTest, Expect, SetupFixture } from 'alsatian';

import type { IMessage } from '../../../src/definition/messages';
import { MessageRead } from '../../../src/server/accessors';
import type { MessageBridge } from '../../../src/server/bridges';
import { TestData } from '../../test-data/utilities';

export class MessageReadAccessorTestFixture {
    private msg: IMessage;

    private mockMsgBridgeWithMsg: MessageBridge;

    private mockMsgBridgeNoMsg: MessageBridge;

    @SetupFixture
    public setupFixture() {
        this.msg = TestData.getMessage();

        const theMsg = this.msg;
        this.mockMsgBridgeWithMsg = {
            doGetById(id, appId): Promise<IMessage> {
                return Promise.resolve(theMsg);
            },
        } as MessageBridge;

        this.mockMsgBridgeNoMsg = {
            doGetById(id, appId): Promise<IMessage> {
                return Promise.resolve(undefined);
            },
        } as MessageBridge;
    }

    @AsyncTest()
    public async expectDataFromMessageRead() {
        Expect(() => new MessageRead(this.mockMsgBridgeWithMsg, 'testing-app')).not.toThrow();

        const mr = new MessageRead(this.mockMsgBridgeWithMsg, 'testing-app');

        Expect(await mr.getById('fake')).toBeDefined();
        Expect(await mr.getById('fake')).toEqual(this.msg);

        Expect(await mr.getSenderUser('fake')).toBeDefined();
        Expect(await mr.getSenderUser('fake')).toEqual(this.msg.sender);

        Expect(await mr.getRoom('fake')).toBeDefined();
        Expect(await mr.getRoom('fake')).toEqual(this.msg.room);
    }

    @AsyncTest()
    public async doNotExpectDataFromMessageRead() {
        Expect(() => new MessageRead(this.mockMsgBridgeNoMsg, 'testing')).not.toThrow();

        const nomr = new MessageRead(this.mockMsgBridgeNoMsg, 'testing');
        Expect(await nomr.getById('fake')).not.toBeDefined();
        Expect(await nomr.getSenderUser('fake')).not.toBeDefined();
        Expect(await nomr.getRoom('fake')).not.toBeDefined();
    }
}
