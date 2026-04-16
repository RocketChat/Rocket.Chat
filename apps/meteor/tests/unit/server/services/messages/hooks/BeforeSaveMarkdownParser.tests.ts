import { expect } from 'chai';

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

	it('should parse markdown', async () => {
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('hey'),
			config: {},
		});

		expect(message).to.have.property('md');
	});
});
