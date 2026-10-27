import { afterEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const configureMailTransport = sinon.stub();
const sendMail = sinon.stub().resolves();
const Email: { customTransport?: (mail: Record<string, unknown>) => Promise<void> } = {};

const { configureSMTP } = proxyquire.noCallThru().load('./configureSMTP', {
	'meteor/email': { Email },
	'../lib/logger/system': { SystemLogger: { info: sinon.stub() } },
	'../lib/notifications/email/transport': { configureMailTransport, sendMail },
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

	it('should send Meteor email through the app transport, without Meteor package settings', async () => {
		sendMail.resetHistory();
		applySettings(smtpSettings);

		const mail = { to: 'someone@example.com', from: 'rocket.chat@example.com', subject: 'Reset your password', html: '<p>link</p>' };
		await Email.customTransport?.({ packageSettings: {}, ...mail });

		expect(sendMail.calledOnceWithExactly(mail)).to.be.true;
	});

	it('should leave email unsent when there is neither an SMTP host nor MAIL_URL', () => {
		delete process.env.MAIL_URL;

		expect(applySettings({ ...smtpSettings, SMTP_Host: '' })).to.be.undefined;
	});

	it('should configure the transport from MAIL_URL when there is no SMTP host', () => {
		process.env.MAIL_URL = 'smtps://user:secret@mail.example.com:465?pool=true';

		expect(applySettings({ ...smtpSettings, SMTP_Host: '' })).to.equal('smtps://user:secret@mail.example.com:465?pool=true');
	});

	it('should prefer the SMTP settings over MAIL_URL', () => {
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
