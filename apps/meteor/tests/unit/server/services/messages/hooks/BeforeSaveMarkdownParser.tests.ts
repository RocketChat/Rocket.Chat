import { expect } from 'chai';
import { beforeEach } from 'mocha';

import { BeforeSaveMarkdownParser } from '../../../../../../server/services/messages/hooks/BeforeSaveMarkdownParser';

const createMessage = (msg?: string, extra: any = {}) => ({
	_id: 'random',
	rid: 'GENERAL',
	ts: new Date(),
	u: {
		_id: 'userId',
		username: 'username',
	},
	_updatedAt: new Date(),
	msg: msg as string,
	...extra,
});

describe('Markdown parser', () => {
	beforeEach(() => {
		delete process.env.MESSAGE_MAX_PARSE_LENGTH;
	});

	afterEach(() => {
		delete process.env.MESSAGE_MAX_PARSE_LENGTH;
	});

	it('should do nothing if markdown parser is disabled', async () => {
		const markdownParser = new BeforeSaveMarkdownParser(false);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('hey'),
			config: {},
		});

		expect(message).to.not.have.property('md');
	});

	it('should do nothing for E2E messages', async () => {
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('hey', { t: 'e2e' }),
			config: {},
		});

		expect(message).to.not.have.property('md');
	});

	it('should skip parsing when msg exceeds MESSAGE_MAX_PARSE_LENGTH', async () => {
		process.env.MESSAGE_MAX_PARSE_LENGTH = '10';
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('a'.repeat(11)),
			config: {},
		});

		expect(message).to.not.have.property('md');
	});

	it('should parse normally when msg is within MESSAGE_MAX_PARSE_LENGTH', async () => {
		process.env.MESSAGE_MAX_PARSE_LENGTH = '100';
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('short msg'),
			config: {},
		});

		expect(message).to.have.property('md');
	});

	it('should parse normally when MESSAGE_MAX_PARSE_LENGTH is 0', async () => {
		process.env.MESSAGE_MAX_PARSE_LENGTH = '0';
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('short msg'),
			config: {},
		});

		expect(message).to.have.property('md');
	});
});
