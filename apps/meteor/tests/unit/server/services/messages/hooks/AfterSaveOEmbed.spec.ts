import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

require.extensions['.info'] = (module: any) => {
	module.exports = { Info: { version: '1.0.0' } };
};

describe('AfterSaveOEmbed', () => {
	const sandbox = sinon.createSandbox();
	let OEmbed: any;
	let OEmbedCacheMock: any;
	let fetchMock: any;
	let isAbsoluteURLMock: any;
	let loggerMock: any;

	beforeEach(() => {
		OEmbedCacheMock = {
			findOneById: sandbox.stub().resolves(null),
			createWithIdAndData: sandbox.stub().resolves(),
		};

		fetchMock = sandbox.stub().resolves({
			headers: new Map([['content-type', 'text/html']]),
			status: 200,
			body: (async function* () {
				yield Buffer.from('<title>Test Preview</title>');
			})(),
		});

		isAbsoluteURLMock = sandbox.stub().callsFake((url) => /^(https?:\/\/|data:)/.test(url));

		loggerMock = {
			debug: sandbox.stub(),
			error: sandbox.stub(),
			warn: sandbox.stub(),
			info: sandbox.stub(),
		};

		const { OEmbed: importedOEmbed } = proxyquire.noCallThru().load('../../../../../../server/services/messages/hooks/AfterSaveOEmbed', {
			'@rocket.chat/models': {
				OEmbedCache: OEmbedCacheMock,
				Messages: {},
			},
			'@rocket.chat/server-fetch': {
				serverFetch: fetchMock,
			},
			'@rocket.chat/tools': {
				isAbsoluteURL: isAbsoluteURLMock,
			},
			'../../../settings': {
				settings: {
					get: sandbox.stub().callsFake((key: string) => {
						if (key === 'API_EmbedSafePorts') return '80,443';
						if (key === 'API_EmbedIgnoredHosts') return 'localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16';
						if (key === 'API_Embed') return true;
						if (key === 'Site_Url') return 'http://localhost:3000';
						return '';
					}),
				},
			},
			'../lib/oembed/providers': {
				afterParseUrlContent: sandbox.stub().callsFake((parsedObj: any) => parsedObj),
				beforeGetUrlContent: sandbox.stub().callsFake((urlObj: any) => urlObj),
			},
			'@rocket.chat/logger': {
				Logger: sandbox.stub().returns(loggerMock),
			},
			'../../../../app/utils/rocketchat.info': {
				Info: { version: '1.0.0' },
			},
		});

		OEmbed = importedOEmbed;
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('parseUrl', () => {
		it('should bail out early for invalid URLs', async () => {
			const result = await OEmbed.parseUrl('invalid-url');
			expect(result.foundMeta).to.be.false;
			expect(fetchMock.called).to.be.false;
		});

		it('should fetch OEmbed for standard HTTPS URLs', async () => {
			const result = await OEmbed.parseUrl('https://google.com');
			expect(result.foundMeta).to.be.true;
			expect(result.urlPreview.meta.pageTitle).to.equal('Test Preview');
			expect(fetchMock.calledOnce).to.be.true;
			expect(fetchMock.firstCall.args[0]).to.equal('https://google.com/');
		});

		it('should fetch OEmbed for protocol-relative URLs (e.g. //www.google.com)', async () => {
			const result = await OEmbed.parseUrl('//www.google.com');

			expect(result.foundMeta).to.be.true;
			expect(result.urlPreview.meta.pageTitle).to.equal('Test Preview');
			expect(fetchMock.calledOnce).to.be.true;
			expect(fetchMock.firstCall.args[0]).to.equal('https://www.google.com/');
		});

		it('should fail safely if a malformed protocol-relative URL is passed (e.g. //)', async () => {
			const result = await OEmbed.parseUrl('//');
			expect(result.foundMeta).to.be.false;
			expect(fetchMock.called).to.be.false;
			expect(loggerMock.error.calledOnce).to.be.true;
			expect(loggerMock.error.firstCall.args[0].msg).to.equal('Invalid URL for OEmbed');
		});
	});
});
