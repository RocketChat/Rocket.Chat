import { expect } from 'chai';
import { describe, it } from 'mocha';

import { parseUrlsFromMessage } from '../../../../lib/parseUrlsFromMessage';

const date = new Date('2021-10-27T00:00:00.000Z');

const baseMessage = {
	ts: date,
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: date,
	urls: [],
};

describe('parseUrlsFromMessage()', () => {
	console.log("TESTSTST")
	it('should return an empty array', () => {
		expect(
			parseUrlsFromMessage({
				...baseMessage,
				msg: 'No links in this message.',
			})
		).to.eql([]);
	});

	it('it should return an array with 2 links', () => {
		expect(
			parseUrlsFromMessage({
				...baseMessage,
				msg: 'Link one - https://a.com and Link two - https://b.com',
			})
		).to.eql(['https://a.com', 'https://b.com']);
	});

	it('it should return an array with 2 links for links with labels', () => {
		expect(
			parseUrlsFromMessage({
				...baseMessage,
				msg: 'Message with Line breaks. [Link one](https://a.com) [Link two](https://b.com)',
			})
		).to.eql(['https://a.com', 'https://b.com']);
	});
});
