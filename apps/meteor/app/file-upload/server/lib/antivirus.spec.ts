import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGetMap = new Map<string, unknown>();
const settingsStub = {
	get: sinon.stub(),
};
const scanStub = sinon.stub();
const scanBufferStub = sinon.stub();
const systemLoggerStub = {
	warn: sinon.stub(),
};
const i18nStub = {
	t: sinon.stub().callsFake((key) => key),
};
const verdictStub = {
	Clean: Symbol('Clean'),
	Malicious: Symbol('Malicious'),
	ScanError: Symbol('ScanError'),
};

class MeteorError extends Error {
	public error: string;

	constructor(error: string, reason: string) {
		super(reason);
		this.error = error;
	}
}

const { scanFileUploadWithAntivirus } = proxyquire.noCallThru().load('./antivirus', {
	'pompelmi': {
		scan: scanStub,
		scanBuffer: scanBufferStub,
		Verdict: verdictStub,
	},
	'meteor/meteor': {
		Meteor: {
			Error: MeteorError,
		},
	},
	'../../../../server/lib/i18n': {
		i18n: i18nStub,
	},
	'../../../../server/lib/logger/system': {
		SystemLogger: systemLoggerStub,
	},
	'../../../settings/server': {
		settings: settingsStub,
	},
});

const file = {
	_id: 'file-id',
	name: 'file.txt',
	rid: 'room-id',
	userId: 'user-id',
	size: 4,
};

describe('FileUpload antivirus scanning', () => {
	beforeEach(() => {
		settingsGetMap.clear();
		settingsGetMap.set('FileUpload_Antivirus_Enabled', true);
		settingsGetMap.set('FileUpload_Antivirus_ClamAV_Mode', 'Local');

		settingsStub.get.reset();
		settingsStub.get.callsFake((settingName) => settingsGetMap.get(settingName));
		scanStub.reset();
		scanBufferStub.reset();
		systemLoggerStub.warn.reset();
		i18nStub.t.resetHistory();
	});

	it('skips scanning when antivirus scanning is disabled', async () => {
		settingsGetMap.set('FileUpload_Antivirus_Enabled', false);

		await scanFileUploadWithAntivirus({ file, content: Buffer.from('safe'), language: 'en' });

		expect(scanStub.called).to.equal(false);
		expect(scanBufferStub.called).to.equal(false);
	});

	it('scans buffers with local clamscan options by default', async () => {
		const content = Buffer.from('safe');
		scanBufferStub.resolves(verdictStub.Clean);

		await scanFileUploadWithAntivirus({ file, content, language: 'en' });

		expect(scanBufferStub.calledOnce).to.equal(true);
		expect(scanBufferStub.firstCall.args).to.deep.equal([content, {}]);
	});

	it('scans file paths with clamd TCP options', async () => {
		settingsGetMap.set('FileUpload_Antivirus_ClamAV_Mode', 'TCP');
		settingsGetMap.set('FileUpload_Antivirus_ClamAV_Host', 'clamav');
		settingsGetMap.set('FileUpload_Antivirus_ClamAV_Port', 3310);
		settingsGetMap.set('FileUpload_Antivirus_ClamAV_Timeout', 30000);
		scanStub.resolves(verdictStub.Clean);

		await scanFileUploadWithAntivirus({ file, content: '/tmp/upload', language: 'en' });

		expect(scanStub.calledOnce).to.equal(true);
		expect(scanStub.firstCall.args).to.deep.equal(['/tmp/upload', { host: 'clamav', port: 3310, timeout: 30000 }]);
	});

	it('rejects malicious uploads', async () => {
		scanBufferStub.resolves(verdictStub.Malicious);

		try {
			await scanFileUploadWithAntivirus({ file, content: Buffer.from('bad'), language: 'en' });
			throw new Error('Expected scan to reject');
		} catch (error: any) {
			expect(error.error).to.equal('error-file-upload-malware-detected');
		}
	});

	it('rejects uploads when scanning fails', async () => {
		scanBufferStub.rejects(new Error('clamscan missing'));

		try {
			await scanFileUploadWithAntivirus({ file, content: Buffer.from('safe'), language: 'en' });
			throw new Error('Expected scan to reject');
		} catch (error: any) {
			expect(error.error).to.equal('error-file-upload-antivirus-scan-failed');
			expect(systemLoggerStub.warn.calledOnce).to.equal(true);
		}
	});
});
