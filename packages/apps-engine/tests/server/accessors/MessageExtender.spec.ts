import { Expect, Test } from 'alsatian';

import type { IMessage } from '../../../src/definition/messages';
import { MessageExtender } from '../../../src/server/accessors';
import { TestData } from '../../test-data/utilities';

export class MessageExtenderAccessorTestFixture {
    @Test()
    public basicMessageExtender() {
        Expect(() => new MessageExtender({} as IMessage)).not.toThrow();
        Expect(() => new MessageExtender(TestData.getMessage())).not.toThrow();
    }

    @Test()
    public usingMessageExtender() {
        const msg: IMessage = {} as IMessage;
        const me = new MessageExtender(msg);

        Expect(msg.attachments).toBeDefined();
        Expect(msg.attachments).toBeEmpty();
        Expect(me.addCustomField('thing', 'value')).toBe(me);
        Expect(msg.customFields).toBeDefined();
        Expect(msg.customFields.thing).toBe('value');
        Expect(() => me.addCustomField('thing', 'second')).toThrowError(Error, 'The message already contains a custom field by the key: thing');
        Expect(() => me.addCustomField('thing.', 'second')).toThrowError(Error, 'The given key contains a period, which is not allowed. Key: thing.');

        Expect(me.addAttachment({})).toBe(me);
        Expect(msg.attachments.length).toBe(1);
        Expect(me.addAttachments([{ collapsed: true }, { color: '#f00' }])).toBe(me);
        Expect(msg.attachments.length).toBe(3);

        Expect(me.getMessage()).not.toBe(msg);
        Expect(me.getMessage()).toEqual(msg);
    }
}
