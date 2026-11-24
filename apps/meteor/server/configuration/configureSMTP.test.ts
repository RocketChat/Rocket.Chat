import { afterEach, before, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const configureMailTransport = sinon.stub();

let configureSMTP: any;

before(async () => {
	const moduleMocks = [
		mock.module('../lib/logger/system', { exports: { SystemLogger: { info: sinon.stub() } } }),
		mock.module('../lib/notifications/email/transport', { exports: { configureMailTransport } }),
	];
	({ configureSMTP } = await import('./configureSMTP'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

const applySettings = (values: Record<string, unknown>) => {
	configureMailTransport.resetHistory();
	configureSMTP({
		get: (id: string) => values[id],
		watchMultiple: (_ids: string[], callback: () => void) => callback(),
	});
	expect(configureMailTransport.calledOnce).to.be.true;
	return configureMailTransport.firstCall.args[0];
};

const smtpSettings = {
	SMTP_Host: 'smtp.example.com',
	SMTP_Protocol: 'smtp',
	SMTP_Port: '',
	SMTP_Username: '',
	SMTP_Password: '',
	SMTP_Pool: true,
	SMTP_IgnoreTLS: false,
};

describe('configureSMTP', () => {
	const originalMailUrl = process.env.MAIL_URL;

	afterEach(() => {
		if (originalMailUrl === undefined) {
			delete process.env.MAIL_URL;
		} else {
			process.env.MAIL_URL = originalMailUrl;
		}
	});

	it('should leave email unsent when there is no SMTP host, even with MAIL_URL set', () => {
		process.env.MAIL_URL = 'smtps://user:secret@mail.example.com:465?pool=true';

		expect(applySettings({ ...smtpSettings, SMTP_Host: '' })).to.be.undefined;
	});

	it('should build the transport from the SMTP settings, not MAIL_URL', () => {
		process.env.MAIL_URL = 'smtps://user:secret@mail.example.com:465';

		expect(applySettings(smtpSettings)).to.deep.equal({ host: 'smtp.example.com', secure: false, pool: true });
	});

	it('should connect securely, with credentials and port, over smtps', () => {
		const options = applySettings({
			...smtpSettings,
			SMTP_Protocol: 'smtps',
			SMTP_Port: '465',
			SMTP_Username: 'user@example.com',
			SMTP_Password: 'p@ss:w/rd',
			SMTP_Pool: false,
			SMTP_IgnoreTLS: true,
		});

		expect(options).to.deep.equal({
			host: 'smtp.example.com',
			secure: true,
			pool: false,
			port: 465,
			auth: { user: 'user@example.com', pass: 'p@ss:w/rd' },
		});
	});

	it('should ignore TLS only over plain smtp', () => {
		expect(applySettings({ ...smtpSettings, SMTP_IgnoreTLS: true })).to.deep.equal({
			host: 'smtp.example.com',
			secure: false,
			pool: true,
			ignoreTLS: true,
		});
	});

	for (const credentials of [
		{ SMTP_Username: 'user', SMTP_Password: '' },
		{ SMTP_Username: '', SMTP_Password: 'secret' },
	]) {
		it(`should not authenticate with partial credentials ${JSON.stringify(credentials)}`, () => {
			expect(applySettings({ ...smtpSettings, ...credentials })).to.not.have.property('auth');
		});
	}

	for (const port of ['not-a-port', '0']) {
		it(`should leave the port to nodemailer when SMTP_Port is ${JSON.stringify(port)}`, () => {
			expect(applySettings({ ...smtpSettings, SMTP_Port: port })).to.not.have.property('port');
		});
	}
});
