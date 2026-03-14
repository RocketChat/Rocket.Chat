import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IMessage } from '../../../../src/definition/messages';
import type { IUser } from '../../../../src/definition/users';
import { MessageBuilder, UserBuilder } from '../../../../src/server/accessors';
import { TestData } from '../../../test-data/utilities';

describe('MessageBuilder', () => {
	it('basicMessageBuilder', () => {
		assert.doesNotThrow(() => new MessageBuilder());
		assert.doesNotThrow(() => new MessageBuilder(TestData.getMessage()));
	});

	it('settingOnMessageBuilder', () => {
		const mbOnce = new MessageBuilder();

		// setData just replaces the passed in object, so let's treat it differently
		assert.strictEqual(mbOnce.setData({ text: 'hello' } as IMessage), mbOnce);
		assert.strictEqual((mbOnce as any).msg.text, 'hello');

		const mbUpdate = new MessageBuilder();
		const editor = new UserBuilder();
		editor.setUsername('username');
		editor.setDisplayName('name');

		// setUpdateData keeps the ID passed in the message object, so let's treat it differently
		assert.strictEqual(mbUpdate.setUpdateData({ text: 'hello', id: 'messageID' } as IMessage, editor.getUser() as IUser), mbUpdate);
		assert.strictEqual((mbUpdate as any).msg.text, 'hello');
		assert.strictEqual((mbUpdate as any).msg.id, 'messageID');

		const msg: IMessage = {} as IMessage;
		const mb = new MessageBuilder(msg);

		assert.strictEqual(mb.setThreadId('a random thread id'), mb);
		assert.strictEqual(msg.threadId, 'a random thread id');
		assert.strictEqual(mb.getThreadId(), 'a random thread id');

		const room = TestData.getRoom();
		assert.strictEqual(mb.setRoom(room), mb);
		assert.deepStrictEqual(msg.room, room);
		assert.deepStrictEqual(mb.getRoom(), room);

		const sender = TestData.getUser();
		assert.strictEqual(mb.setSender(sender), mb);
		assert.deepStrictEqual(msg.sender, sender);
		assert.deepStrictEqual(mb.getSender(), sender);

		assert.strictEqual(mb.setText('testing, yo!'), mb);
		assert.deepStrictEqual(msg.text, 'testing, yo!');
		assert.deepStrictEqual(mb.getText(), 'testing, yo!');

		assert.strictEqual(mb.setEmojiAvatar(':ghost:'), mb);
		assert.deepStrictEqual(msg.emoji, ':ghost:');
		assert.deepStrictEqual(mb.getEmojiAvatar(), ':ghost:');

		assert.strictEqual(mb.setAvatarUrl('https://rocket.chat/'), mb);
		assert.deepStrictEqual(msg.avatarUrl, 'https://rocket.chat/');
		assert.deepStrictEqual(mb.getAvatarUrl(), 'https://rocket.chat/');

		assert.strictEqual(mb.setUsernameAlias('Some Bot'), mb);
		assert.deepStrictEqual(msg.alias, 'Some Bot');
		assert.deepStrictEqual(mb.getUsernameAlias(), 'Some Bot');

		assert.strictEqual(msg.attachments, undefined);
		assert.strictEqual(mb.getAttachments(), undefined);
		assert.strictEqual(mb.addAttachment({ color: '#0ff' }), mb);
		assert.ok(msg.attachments !== undefined);
		assert.ok(mb.getAttachments() !== undefined);
		assert.ok(msg.attachments.length > 0);
		assert.ok(mb.getAttachments().length > 0);

		assert.deepStrictEqual(msg.attachments[0].color, '#0ff');
		assert.deepStrictEqual(mb.getAttachments()[0].color, '#0ff');

		assert.strictEqual(mb.setAttachments([]), mb);
		assert.strictEqual(msg.attachments.length, 0);
		assert.strictEqual(mb.getAttachments().length, 0);

		delete msg.attachments;
		assert.throws(() => mb.replaceAttachment(1, {}), { name: 'Error', message: 'No attachment found at the index of "1" to replace.' });
		assert.strictEqual(mb.addAttachment({}), mb);
		assert.strictEqual(mb.replaceAttachment(0, { color: '#f0f' }), mb);
		assert.deepStrictEqual(msg.attachments[0].color, '#f0f');
		assert.deepStrictEqual(mb.getAttachments()[0].color, '#f0f');

		assert.strictEqual(mb.removeAttachment(0), mb);
		assert.strictEqual(msg.attachments.length, 0);
		assert.strictEqual(mb.getAttachments().length, 0);

		delete msg.attachments;
		assert.throws(() => mb.removeAttachment(4), { name: 'Error', message: 'No attachment found at the index of "4" to remove.' });

		const msgEditor = TestData.getUser('msg-editor-id');
		assert.strictEqual(mb.setEditor(msgEditor), mb);
		assert.ok(msg.editor !== undefined);
		assert.ok(mb.getEditor() !== undefined);
		assert.deepStrictEqual(msg.editor.id, 'msg-editor-id');
		assert.deepStrictEqual(mb.getEditor().id, 'msg-editor-id');

		assert.strictEqual(mb.getMessage(), msg);
		delete msg.room;
		assert.throws(() => mb.getMessage(), { name: 'Error', message: 'The "room" property is required.' });

		assert.strictEqual(mb.setGroupable(true), mb);
		assert.deepStrictEqual(msg.groupable, true);
		assert.deepStrictEqual(mb.getGroupable(), true);

		assert.strictEqual(mb.setGroupable(false), mb);
		assert.deepStrictEqual(msg.groupable, false);
		assert.deepStrictEqual(mb.getGroupable(), false);

		assert.strictEqual(mb.setParseUrls(true), mb);
		assert.deepStrictEqual(msg.parseUrls, true);
		assert.deepStrictEqual(mb.getParseUrls(), true);

		assert.strictEqual(mb.setParseUrls(false), mb);
		assert.deepStrictEqual(msg.parseUrls, false);
		assert.deepStrictEqual(mb.getParseUrls(), false);

		assert.strictEqual(mb.addCustomField('thing', 'value'), mb);
		assert.ok(msg.customFields !== undefined);
		assert.strictEqual(msg.customFields.thing, 'value');
		assert.throws(() => mb.addCustomField('thing', 'second'), {
			name: 'Error',
			message: 'The message already contains a custom field by the key: thing',
		});
		assert.throws(() => mb.addCustomField('thing.', 'second'), {
			name: 'Error',
			message: 'The given key contains a period, which is not allowed. Key: thing.',
		});
	});
});
