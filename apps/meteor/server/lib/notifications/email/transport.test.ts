import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const createTransport = sinon.stub();
const SystemLogger = { info: sinon.stub(), warn: sinon.stub() };

const { configureMailTransport, sendMail } = proxyquire.noCallThru().load('./transport', {
	'nodemailer': { createTransport },
	'../../logger/system': { SystemLogger },
});

const fakeTransport = () => ({ sendMail: sinon.stub().resolves(), close: sinon.stub() });

const mail = { to: 'someone@example.com', from: 'rocket.chat@example.com', subject: 'Hello', text: 'Hello' };

describe('email transport', () => {
	const originalTestMode = process.env.TEST_MODE;

	beforeEach(() => {
		delete process.env.TEST_MODE;
		createTransport.reset();
		SystemLogger.info.reset();
		SystemLogger.warn.reset();
	});

	afterEach(() => {
		configureMailTransport(undefined);
		if (originalTestMode === undefined) {
			delete process.env.TEST_MODE;
		} else {
			process.env.TEST_MODE = originalTestMode;
		}
	});

	it('should send mail through a transport built from the given options', async () => {
		const transport = fakeTransport();
		createTransport.returns(transport);
		const options = { host: 'smtp.example.com', port: 587, secure: false, pool: true };

		configureMailTransport(options);
		await sendMail(mail);

		expect(createTransport.calledOnceWithExactly(options)).to.be.true;
		expect(transport.sendMail.calledOnceWithExactly(mail)).to.be.true;
	});

	it('should close the previous transport when reconfigured', async () => {
		const first = fakeTransport();
		const second = fakeTransport();
		createTransport.onFirstCall().returns(first).onSecondCall().returns(second);

		configureMailTransport({ host: 'old.example.com', secure: false, pool: true });
		configureMailTransport({ host: 'new.example.com', secure: true, pool: true });
		await sendMail(mail);

		expect(first.close.calledOnce).to.be.true;
		expect(first.sendMail.called).to.be.false;
		expect(second.sendMail.calledOnceWithExactly(mail)).to.be.true;
	});

	it('should close the previous transport only after the mail already handed to it is delivered', async () => {
		const first = fakeTransport();
		const delivery = Promise.withResolvers<void>();
		first.sendMail.returns(delivery.promise);
		createTransport.onFirstCall().returns(first).onSecondCall().returns(fakeTransport());

		configureMailTransport({ host: 'old.example.com', secure: false, pool: true });
		const sending = sendMail(mail);
		configureMailTransport({ host: 'new.example.com', secure: true, pool: true });

		expect(first.close.called).to.be.false;
		delivery.resolve();
		await sending;
		expect(first.close.calledOnce).to.be.true;
	});

	it('should close the previous transport once the mail already handed to it fails, and propagate the failure', async () => {
		const first = fakeTransport();
		const delivery = Promise.withResolvers<void>();
		first.sendMail.returns(delivery.promise);
		createTransport.onFirstCall().returns(first).onSecondCall().returns(fakeTransport());

		configureMailTransport({ host: 'old.example.com', secure: false, pool: true });
		const sending = sendMail(mail);
		configureMailTransport({ host: 'new.example.com', secure: true, pool: true });

		expect(first.close.called).to.be.false;
		delivery.reject(new Error('connection refused'));
		await expect(sending).to.be.rejectedWith('connection refused');
		expect(first.close.calledOnce).to.be.true;
	});

	it('should close the transport and warn instead of sending once SMTP is unconfigured', async () => {
		const transport = fakeTransport();
		createTransport.returns(transport);

		configureMailTransport({ host: 'smtp.example.com', secure: false, pool: true });
		configureMailTransport(undefined);
		await sendMail(mail);

		expect(transport.close.calledOnce).to.be.true;
		expect(transport.sendMail.called).to.be.false;
		expect(SystemLogger.warn.calledOnce).to.be.true;
	});

	it('should propagate a failed delivery to the caller', async () => {
		const transport = fakeTransport();
		transport.sendMail.rejects(new Error('connection refused'));
		createTransport.returns(transport);

		configureMailTransport({ host: 'smtp.example.com', secure: false, pool: true });

		await expect(sendMail(mail)).to.be.rejectedWith('connection refused');
	});

	for (const testMode of ['true', 'api']) {
		it(`should log instead of sending when TEST_MODE is ${testMode}`, async () => {
			const transport = fakeTransport();
			createTransport.returns(transport);
			process.env.TEST_MODE = testMode;

			configureMailTransport({ host: 'smtp.example.com', secure: false, pool: true });
			await sendMail(mail);

			expect(transport.sendMail.called).to.be.false;
			expect(SystemLogger.info.calledOnce).to.be.true;
		});
	}
});
