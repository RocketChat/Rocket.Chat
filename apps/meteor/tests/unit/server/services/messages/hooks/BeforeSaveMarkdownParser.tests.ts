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

	it('should do nothing for OTR messages', async () => {
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('hey', { t: 'otr' }),
			config: {},
		});

		const messageAck = await markdownParser.parseMarkdown({
			message: createMessage('hey', { t: 'otr-ack' }),
			config: {},
		});

		expect(message).to.not.have.property('md');
		expect(messageAck).to.not.have.property('md');
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

	it('should parse markdown on the first attachment only', async () => {
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('hey', {
				attachments: [
					{
						description: 'hey ho',
					},
					{
						description: 'lets go',
					},
				],
			}),
			config: {},
		});

		expect(message).to.have.property('md');

		const [attachment1, attachment2] = message.attachments || [];

		expect(attachment1).to.have.property('descriptionMd');
		expect(attachment2).to.not.have.property('descriptionMd');
	});
});
