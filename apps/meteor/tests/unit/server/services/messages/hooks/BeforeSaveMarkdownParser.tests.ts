import { expect } from 'chai';
import { beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import * as sinon from 'sinon';

const settingsStub = { get: sinon.stub() };

const { BeforeSaveMarkdownParser } = proxyquire
	.noCallThru()
	.load('../../../../../../server/services/messages/hooks/BeforeSaveMarkdownParser', {
		'../../../../app/settings/server': {
			settings: settingsStub,
		},
	});

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
		settingsStub.get.reset();
		settingsStub.get.withArgs('Message_MaxMarkdownParseLength').returns(0); // disabled by default
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

	it('should skip parsing when msg exceeds Message_MaxMarkdownParseLength', async () => {
		settingsStub.get.withArgs('Message_MaxMarkdownParseLength').returns(10);
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('a'.repeat(11)),
			config: {},
		});

		expect(message).to.not.have.property('md');
	});

	it('should parse normally when msg is within Message_MaxMarkdownParseLength', async () => {
		settingsStub.get.withArgs('Message_MaxMarkdownParseLength').returns(100);
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('short msg'),
			config: {},
		});

		expect(message).to.have.property('md');
	});

	it('should parse normally when Message_MaxMarkdownParseLength is 0', async () => {
		settingsStub.get.withArgs('Message_MaxMarkdownParseLength').returns(0);
		const markdownParser = new BeforeSaveMarkdownParser(true);

		const message = await markdownParser.parseMarkdown({
			message: createMessage('a'.repeat(99999)),
			config: {},
		});

		expect(message).to.have.property('md');
	});
});
