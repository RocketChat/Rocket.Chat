import { expect } from 'chai';

import { BeforeSaveBadWords } from '../../../../../../server/services/messages/hooks/BeforeSaveBadWords';

const createMessage = (msg?: string) => ({
	_id: 'random',
	rid: 'GENERAL',
	ts: new Date(),
	u: {
		_id: 'userId',
		username: 'username',
	},
	_updatedAt: new Date(),
	msg: msg as string,
});

describe('Filter bad words before saving message', () => {
	it('should return same message if bad words not configured', async () => {
		const badWords = new BeforeSaveBadWords();

		const message = createMessage('hell');

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.be.equal('hell');
	});

	it("should return same message if no 'msg' property provided", async () => {
		const badWords = new BeforeSaveBadWords();

		const message = createMessage();

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.be.equal(undefined);
	});

	it('should return filter bad words from message when configured', async () => {
		const badWords = new BeforeSaveBadWords();
		await badWords.configure();

		const message = createMessage('hell');

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.equal('****');
	});

	it('should return same message if bad words disabled after configured', async () => {
		const badWords = new BeforeSaveBadWords();
		await badWords.configure();

		badWords.disable();

		const message = createMessage('hell');

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.be.equal('hell');
	});

	it('should filter custom bad words', async () => {
		const badWords = new BeforeSaveBadWords();
		await badWords.configure('good');

		const message = createMessage('good');

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.be.equal('****');
	});

	it('should allow custom good words', async () => {
		const badWords = new BeforeSaveBadWords();
		await badWords.configure(undefined, 'hell');

		const message = createMessage('hell');

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.be.equal('hell');
	});

	it('should filter non ascii bad words', async () => {
		const badWords = new BeforeSaveBadWords();
		await badWords.configure('バカ');

		const message = createMessage('hell is バカ');

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.be.equal('**** is **');
	});

	it('should filter just the non ascii bad words', async () => {
		const badWords = new BeforeSaveBadWords();
		await badWords.configure('バカ');

		const message = createMessage('バカ');

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.be.equal('**');
	});

	it('should filter non ascii bad words with punctuation', async () => {
		const badWords = new BeforeSaveBadWords();
		await badWords.configure('バカ');

		const message = createMessage('バカ.');

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.be.equal('**.');
	});

	it('should not filter non ascii bad words, if part of another word ', async () => {
		const badWords = new BeforeSaveBadWords();
		await badWords.configure('バカ');

		const message = createMessage('TESTバカTEST');

		const result = await badWords.filterBadWords({ message });

		return expect(result.msg).to.be.equal('TESTバカTEST');
	});
});
