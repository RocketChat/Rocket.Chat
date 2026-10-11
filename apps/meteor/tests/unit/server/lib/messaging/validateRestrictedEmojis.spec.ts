import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import * as restrictedEmojisModule from '../../../../../lib/emoji/restrictedEmojis';

const settingsGetMock = sinon.stub();
const hasPermissionAsyncMock = sinon.stub();
const getEmojiDataMock = sinon.stub();

class MeteorError extends Error {
	public error: string;

	public details: unknown;

	constructor(error: string, reason?: string, details?: unknown) {
		super(reason || error);
		this.error = error;
		this.details = details;
	}
}

const { assertNoRestrictedEmojis } = proxyquire.noCallThru().load('../../../../../server/lib/validateRestrictedEmojis.ts', {
	'meteor/meteor': { Meteor: { Error: MeteorError } },
	'../../lib/emoji/restrictedEmojis': restrictedEmojisModule,
	'../../lib/emoji-native/generateEmojiData': {
		getEmojiData: getEmojiDataMock,
	},
	'./authorization/hasPermission': { hasPermissionAsync: hasPermissionAsyncMock },
	'../settings': { settings: { get: settingsGetMock } },
});

describe('assertNoRestrictedEmojis', () => {
	beforeEach(() => {
		settingsGetMock.reset();
		hasPermissionAsyncMock.reset();
		getEmojiDataMock.reset();

		settingsGetMock.withArgs('Emoji_Restricted_For_Users').returns('eggplant,peach,middle_finger');
		hasPermissionAsyncMock.resolves(false);
		getEmojiDataMock.returns({
			emojiList: {
				':eggplant:': { unicode: '🍆' },
				':peach:': { unicode: '🍑' },
				':middle_finger:': { unicode: '🖕' },
			},
			bareAliases: new Map(),
		});
	});

	it('should allow messages when the setting is empty', async () => {
		settingsGetMock.withArgs('Emoji_Restricted_For_Users').returns('');

		await assertNoRestrictedEmojis('user-id', 'hello :eggplant:', 'sendMessage');
	});

	it('should allow messages when msg is empty', async () => {
		await assertNoRestrictedEmojis('user-id', '', 'sendMessage');
		await assertNoRestrictedEmojis('user-id', undefined, 'sendMessage');
	});

	it('should allow users with manage-emoji permission to use restricted emojis', async () => {
		hasPermissionAsyncMock.resolves(true);

		await assertNoRestrictedEmojis('admin-id', 'hello :eggplant:', 'sendMessage');
		expect(hasPermissionAsyncMock.calledWith('admin-id', 'manage-emoji')).to.equal(true);
	});

	it('should allow messages without restricted emojis', async () => {
		await assertNoRestrictedEmojis('user-id', 'hello :smile: world', 'sendMessage');
	});

	it('should block restricted shortcodes on sendMessage', async () => {
		try {
			await assertNoRestrictedEmojis('user-id', 'look :eggplant:', 'sendMessage');
			expect.fail('expected error-emoji-restricted');
		} catch (error: any) {
			expect(error).to.be.instanceOf(MeteorError);
			expect(error.error).to.equal('error-emoji-restricted');
			expect(error.details).to.deep.include({ method: 'sendMessage', emoji: 'eggplant' });
		}
	});

	it('should block restricted shortcodes on updateMessage', async () => {
		try {
			await assertNoRestrictedEmojis('user-id', 'edited :peach:', 'updateMessage');
			expect.fail('expected error-emoji-restricted');
		} catch (error: any) {
			expect(error).to.be.instanceOf(MeteorError);
			expect(error.error).to.equal('error-emoji-restricted');
			expect(error.details).to.deep.include({ method: 'updateMessage', emoji: 'peach' });
		}
	});

	it('should block tone variants of restricted emojis', async () => {
		try {
			await assertNoRestrictedEmojis('user-id', ':middle_finger_tone2:', 'sendMessage');
			expect.fail('expected error-emoji-restricted');
		} catch (error: any) {
			expect(error.error).to.equal('error-emoji-restricted');
			expect(error.details).to.deep.include({ emoji: 'middle_finger_tone2' });
		}
	});

	it('should block unicode emojis converted to restricted shortnames', async () => {
		try {
			await assertNoRestrictedEmojis('user-id', 'unicode 🍆 here', 'sendMessage');
			expect.fail('expected error-emoji-restricted');
		} catch (error: any) {
			expect(error.error).to.equal('error-emoji-restricted');
			expect(error.details).to.deep.include({ emoji: 'eggplant' });
		}
	});

	it('should normalize restricted setting values with colons and casing', async () => {
		settingsGetMock.withArgs('Emoji_Restricted_For_Users').returns(' :Eggplant: , Peach ');

		try {
			await assertNoRestrictedEmojis('user-id', ':eggplant:', 'sendMessage');
			expect.fail('expected error-emoji-restricted');
		} catch (error: any) {
			expect(error.error).to.equal('error-emoji-restricted');
		}
	});
});
