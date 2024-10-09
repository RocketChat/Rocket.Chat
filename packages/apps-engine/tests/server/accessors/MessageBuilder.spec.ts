import { Expect, Test } from 'alsatian';

import type { IMessage } from '../../../src/definition/messages';
import type { IUser } from '../../../src/definition/users';
import { MessageBuilder, UserBuilder } from '../../../src/server/accessors';
import { TestData } from '../../test-data/utilities';

export class MessageBuilderAccessorTestFixture {
    @Test()
    public basicMessageBuilder() {
        Expect(() => new MessageBuilder()).not.toThrow();
        Expect(() => new MessageBuilder(TestData.getMessage())).not.toThrow();
    }

    @Test()
    public settingOnMessageBuilder() {
        const mbOnce = new MessageBuilder();

        // setData just replaces the passed in object, so let's treat it differently
        Expect(mbOnce.setData({ text: 'hello' } as IMessage)).toBe(mbOnce);
        Expect((mbOnce as any).msg.text).toBe('hello');

        const mbUpdate = new MessageBuilder();
        const editor = new UserBuilder();
        editor.setUsername('username');
        editor.setDisplayName('name');

        // setUpdateData keeps the ID passed in the message object, so let's treat it differently
        Expect(mbUpdate.setUpdateData({ text: 'hello', id: 'messageID' } as IMessage, editor.getUser() as IUser)).toBe(mbUpdate);
        Expect((mbUpdate as any).msg.text).toBe('hello');
        Expect((mbUpdate as any).msg.id).toBe('messageID');

        const msg: IMessage = {} as IMessage;
        const mb = new MessageBuilder(msg);

        Expect(mb.setThreadId('a random thread id')).toBe(mb);
        Expect(msg.threadId).toBe('a random thread id');
        Expect(mb.getThreadId()).toBe('a random thread id');

        Expect(mb.setRoom(TestData.getRoom())).toBe(mb);
        Expect(msg.room).toEqual(TestData.getRoom());
        Expect(mb.getRoom()).toEqual(TestData.getRoom());

        Expect(mb.setSender(TestData.getUser())).toBe(mb);
        Expect(msg.sender).toEqual(TestData.getUser());
        Expect(mb.getSender()).toEqual(TestData.getUser());

        Expect(mb.setText('testing, yo!')).toBe(mb);
        Expect(msg.text).toEqual('testing, yo!');
        Expect(mb.getText()).toEqual('testing, yo!');

        Expect(mb.setEmojiAvatar(':ghost:')).toBe(mb);
        Expect(msg.emoji).toEqual(':ghost:');
        Expect(mb.getEmojiAvatar()).toEqual(':ghost:');

        Expect(mb.setAvatarUrl('https://rocket.chat/')).toBe(mb);
        Expect(msg.avatarUrl).toEqual('https://rocket.chat/');
        Expect(mb.getAvatarUrl()).toEqual('https://rocket.chat/');

        Expect(mb.setUsernameAlias('Some Bot')).toBe(mb);
        Expect(msg.alias).toEqual('Some Bot');
        Expect(mb.getUsernameAlias()).toEqual('Some Bot');

        Expect(msg.attachments).not.toBeDefined();
        Expect(mb.getAttachments()).not.toBeDefined();
        Expect(mb.addAttachment({ color: '#0ff' })).toBe(mb);
        Expect(msg.attachments).toBeDefined();
        Expect(mb.getAttachments()).toBeDefined();
        Expect(msg.attachments).not.toBeEmpty();
        Expect(mb.getAttachments()).not.toBeEmpty();

        Expect(msg.attachments[0].color).toEqual('#0ff');
        Expect(mb.getAttachments()[0].color).toEqual('#0ff');

        Expect(mb.setAttachments([])).toBe(mb);
        Expect(msg.attachments).toBeEmpty();
        Expect(mb.getAttachments()).toBeEmpty();

        delete msg.attachments;
        Expect(() => mb.replaceAttachment(1, {})).toThrowError(Error, 'No attachment found at the index of "1" to replace.');
        Expect(mb.addAttachment({})).toBe(mb);
        Expect(mb.replaceAttachment(0, { color: '#f0f' })).toBe(mb);
        Expect(msg.attachments[0].color).toEqual('#f0f');
        Expect(mb.getAttachments()[0].color).toEqual('#f0f');

        Expect(mb.removeAttachment(0)).toBe(mb);
        Expect(msg.attachments).toBeEmpty();
        Expect(mb.getAttachments()).toBeEmpty();

        delete msg.attachments;
        Expect(() => mb.removeAttachment(4)).toThrowError(Error, 'No attachment found at the index of "4" to remove.');

        Expect(mb.setEditor(TestData.getUser('msg-editor-id'))).toBe(mb);
        Expect(msg.editor).toBeDefined();
        Expect(mb.getEditor()).toBeDefined();
        Expect(msg.editor.id).toEqual('msg-editor-id');
        Expect(mb.getEditor().id).toEqual('msg-editor-id');

        Expect(mb.getMessage()).toBe(msg);
        delete msg.room;
        Expect(() => mb.getMessage()).toThrowError(Error, 'The "room" property is required.');

        Expect(mb.setGroupable(true)).toBe(mb);
        Expect(msg.groupable).toEqual(true);
        Expect(mb.getGroupable()).toEqual(true);

        Expect(mb.setGroupable(false)).toBe(mb);
        Expect(msg.groupable).toEqual(false);
        Expect(mb.getGroupable()).toEqual(false);

        Expect(mb.setParseUrls(true)).toBe(mb);
        Expect(msg.parseUrls).toEqual(true);
        Expect(mb.getParseUrls()).toEqual(true);

        Expect(mb.setParseUrls(false)).toBe(mb);
        Expect(msg.parseUrls).toEqual(false);
        Expect(mb.getParseUrls()).toEqual(false);

        Expect(mb.addCustomField('thing', 'value')).toBe(mb);
        Expect(msg.customFields).toBeDefined();
        Expect(msg.customFields.thing).toBe('value');
        Expect(() => mb.addCustomField('thing', 'second')).toThrowError(Error, 'The message already contains a custom field by the key: thing');
        Expect(() => mb.addCustomField('thing.', 'second')).toThrowError(Error, 'The given key contains a period, which is not allowed. Key: thing.');
    }
}
