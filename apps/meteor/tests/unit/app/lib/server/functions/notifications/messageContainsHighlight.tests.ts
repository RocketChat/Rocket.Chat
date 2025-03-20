import { expect } from 'chai';
import { describe, it } from 'mocha';

import { messageContainsHighlight } from '../../../../../../../app/lib/server/functions/notifications/messageContainsHighlight';

describe('messageContainsHighlight', () => {
	it('should return false for no highlights', async () => {
		const message = {
			msg: 'regular message',
		};
		expect(messageContainsHighlight(message, [])).to.be.false;
	});

	it('should return true when find a highlight in the beggining of the message', async () => {
		const message = {
			msg: 'highlighted regular message',
		};
		expect(messageContainsHighlight(message, ['highlighted'])).to.be.true;
	});

	it('should return true when find a highlight in the end of the message', async () => {
		const message = {
			msg: 'highlighted regular message',
		};
		expect(messageContainsHighlight(message, ['message'])).to.be.true;
	});

	it('should return false if the highlight is just part of the word', async () => {
		const message = {
			msg: 'highlighted regular message',
		};
		expect(messageContainsHighlight(message, ['light'])).to.be.false;
	});

	it('should return true if find one of the multiple highlights', async () => {
		const message = {
			msg: 'highlighted regular message',
		};
		expect(messageContainsHighlight(message, ['high', 'ssage', 'regular', 'light'])).to.be.true;
	});

	it('should return true if highlight case not match', async () => {
		const message = {
			msg: 'highlighted regular message',
		};
		expect(messageContainsHighlight(message, ['ReGuLaR'])).to.be.true;
	});

	it('should return false if the highlight word is an emoji', async () => {
		const message = {
			msg: 'highlighted :thumbsup: message',
		};
		expect(messageContainsHighlight(message, ['thumbsup'])).to.be.false;
	});

	it('should return true for a highlight word beggining with :', async () => {
		const message = {
			msg: 'highlighted :thumbsup message',
		};
		expect(messageContainsHighlight(message, ['thumbsup'])).to.be.true;
	});

	it('should return true for a highlight word ending with :', async () => {
		const message = {
			msg: 'highlighted thumbsup: message',
		};
		expect(messageContainsHighlight(message, ['thumbsup'])).to.be.true;
	});

	it('should return true when find a cyrillic highlight in the end of the message', async () => {
		const message = {
			msg: 'highlighted regular Привет',
		};
		expect(messageContainsHighlight(message, ['Привет'])).to.be.true;
	});

	it('should return true when find a cyrillic highlight in the beginning of the message', async () => {
		const message = {
			msg: 'Привет highlighted regular',
		};
		expect(messageContainsHighlight(message, ['Привет'])).to.be.true;
	});

	it('should return true when find a cyrillic highlight in the middle of the message', async () => {
		const message = {
			msg: 'highlighted Привет regular',
		};
		expect(messageContainsHighlight(message, ['Привет'])).to.be.true;
	});
});
