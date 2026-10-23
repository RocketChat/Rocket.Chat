import { afterEach, describe, it } from 'node:test';

import { expect } from 'chai';
import nodemailer from 'nodemailer';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const configureMailTransport = sinon.stub();

const { configureSMTP } = proxyquire.noCallThru().load('./configureSMTP', {
	'../lib/logger/system': { SystemLogger: { info: sinon.stub() } },
	'../lib/notifications/email/transport': { configureMailTransport },
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

// accounts-password still sends through Meteor, which hands MAIL_URL to createTransport;
// the app transport has to connect to the same server the same way.
const optionsParsedFromMailUrl = () => {
	const transport = nodemailer.createTransport(process.env.MAIL_URL);
	transport.close();
	return transport.options;
};

const product = <T>(...lists: T[][]): T[][] =>
	lists.reduce<T[][]>((combos, list) => combos.flatMap((combo) => list.map((item) => [...combo, item])), [[]]);

describe('configureSMTP', () => {
	const originalMailUrl = process.env.MAIL_URL;

	afterEach(() => {
		if (originalMailUrl === undefined) {
			delete process.env.MAIL_URL;
		} else {
			process.env.MAIL_URL = originalMailUrl;
		}
	});

	it('should drop MAIL_URL and the app transport when there is no SMTP host', () => {
		process.env.MAIL_URL = 'smtp://previous.example.com';

		expect(applySettings({ SMTP_Host: '', SMTP_Protocol: 'smtp', SMTP_Pool: true })).to.be.undefined;
		expect(process.env.MAIL_URL).to.be.undefined;
	});

	it('should leave the port to nodemailer when SMTP_Port is not a number, where MAIL_URL is unparseable', () => {
		const options = applySettings({ SMTP_Host: 'smtp.example.com', SMTP_Protocol: 'smtp', SMTP_Port: 'not-a-port', SMTP_Pool: true });

		expect(options).to.deep.equal({ host: 'smtp.example.com', secure: false, pool: true });
		expect(optionsParsedFromMailUrl).to.throw('Invalid URL');
	});

	const protocols = ['smtp', 'smtps'];
	const credentials = [
		{ SMTP_Username: '', SMTP_Password: '' },
		{ SMTP_Username: 'user', SMTP_Password: '' },
		{ SMTP_Username: '', SMTP_Password: 'secret' },
		{ SMTP_Username: 'user', SMTP_Password: 'secret' },
		{ SMTP_Username: 'user@example.com', SMTP_Password: 'p@ss:w/rd?#%& é' },
	];
	const ports = ['', '25', '465', '587', ' 2525 ', '0'];
	const toggles = [true, false];

	for (const [protocol, credential, port, pool, ignoreTLS] of product<unknown>(protocols, credentials, ports, toggles, toggles)) {
		const values = {
			SMTP_Host: 'smtp.example.com',
			SMTP_Protocol: protocol,
			SMTP_Port: port,
			SMTP_Pool: pool,
			SMTP_IgnoreTLS: ignoreTLS,
			...(credential as Record<string, string>),
		};

		it(`should configure the transport MAIL_URL describes for ${JSON.stringify(values)}`, () => {
			const options = applySettings(values);

			expect(options).to.deep.equal(optionsParsedFromMailUrl());
		});
	}
});
