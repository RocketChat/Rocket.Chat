import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const { splitSendMessageFields } = proxyquire.noCallThru().load('./splitSendMessageFields', {
	'@rocket.chat/rest-typings': { chatSendMessageFieldNames: ['rid', 'msg', 'tmid', 'location', 'parseUrls', 't', 'content'] },
});

describe('splitSendMessageFields', () => {
	it('should keep the fields a caller may set', () => {
		const message = { rid: 'rid', msg: 'hi', tmid: 'tmid', location: { type: 'Point', coordinates: [1, 2] }, parseUrls: false };

		const { supported, unsupportedNames } = splitSendMessageFields(message);

		expect(supported).to.deep.equal(message);
		expect(unsupportedNames).to.have.lengthOf(0);
	});

	it('should keep the fields that encrypted rooms need', () => {
		const message = { rid: 'rid', t: 'e2e', content: { algorithm: 'rc.v2.aes-sha2' } };

		expect(splitSendMessageFields(message).supported).to.deep.equal(message);
	});

	it('should drop and name the fields the server owns', () => {
		const { supported, unsupportedNames } = splitSendMessageFields({
			rid: 'rid',
			msg: 'hi',
			md: 'x',
			reactions: { x: {} },
			actionLinks: [null],
			urls: [{ url: 'https://example.com' }],
			starred: [{ _id: 'user' }],
			pinned: true,
			pinnedBy: { _id: 'fake', username: 'administrator' },
			editedBy: { _id: 'fake', username: 'someone' },
			editedAt: '2026-01-01T00:00:00.000Z',
		});

		expect(supported).to.deep.equal({ rid: 'rid', msg: 'hi' });
		expect(unsupportedNames).to.have.members([
			'md',
			'reactions',
			'actionLinks',
			'urls',
			'starred',
			'pinned',
			'pinnedBy',
			'editedBy',
			'editedAt',
		]);
	});

	it('should not let a __proto__ key change the result', () => {
		const message = JSON.parse('{"rid":"rid","__proto__":{"pinned":true}}');

		const { supported, unsupportedNames } = splitSendMessageFields(message);

		expect(supported).to.deep.equal({ rid: 'rid' });
		expect(unsupportedNames).to.deep.equal(['__proto__']);
		expect(Object.getPrototypeOf(supported)).to.equal(Object.prototype);
	});
});

describe('the fields chat.sendMessage accepts', () => {
	it('should include every field that real callers send', async () => {
		const { chatSendMessageFieldNames } = await import('@rocket.chat/rest-typings');

		expect(chatSendMessageFieldNames).to.include.members([
			'_id',
			'rid',
			'tmid',
			'tshow',
			'msg',
			'text',
			'alias',
			'emoji',
			'avatar',
			'attachments',
			'blocks',
			'customFields',
			'location',
			'parseUrls',
			't',
			'e2e',
			'e2eMentions',
			'content',
		]);
	});

	it('should leave out the fields the server owns', async () => {
		const { chatSendMessageFieldNames } = await import('@rocket.chat/rest-typings');

		expect(chatSendMessageFieldNames).to.not.include.members([
			'md',
			'urls',
			'reactions',
			'actionLinks',
			'starred',
			'pinned',
			'pinnedBy',
			'editedBy',
		]);
	});
});
