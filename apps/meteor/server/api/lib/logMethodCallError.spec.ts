import { expect } from 'chai';
import { describe, it, before, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const debugMock = sinon.stub();
const errorMock = sinon.stub();
const meteorDebugMock = sinon.stub();
const settingsGetMock = sinon.stub();

describe('logMethodCallError', () => {
	let logMethodCallError: (method: string, err: unknown) => void;

	before(() => {
		({ logMethodCallError } = proxyquire.noCallThru().load('./logMethodCallError', {
			'meteor/meteor': {
				Meteor: { _debug: meteorDebugMock },
			},
			'../../lib/logger/system': {
				SystemLogger: { debug: debugMock, error: errorMock },
			},
			'../../settings': {
				settings: { get: settingsGetMock },
			},
		}));
	});

	beforeEach(() => {
		debugMock.reset();
		errorMock.reset();
		meteorDebugMock.reset();
		settingsGetMock.reset();
		settingsGetMock.withArgs('Log_Level').returns('2');
	});

	it('should not report client-safe errors as exceptions', () => {
		const err = { isClientSafe: true, error: 'error-invalid-user' };

		logMethodCallError('loadHistory', err);

		expect(meteorDebugMock.called).to.be.false;
		expect(errorMock.called).to.be.false;
		expect(debugMock.calledOnce).to.be.true;
		expect(debugMock.calledWithExactly({ msg: 'Expected error while invoking method', err, method: 'loadHistory' })).to.be.true;
	});

	it('should not report meteor errors as exceptions', () => {
		const err = { meteorError: { error: 'totp-required' } };

		logMethodCallError('login', err);

		expect(meteorDebugMock.called).to.be.false;
		expect(errorMock.called).to.be.false;
		expect(debugMock.calledOnce).to.be.true;
		expect(debugMock.calledWithExactly({ msg: 'Expected error while invoking method', err, method: 'login' })).to.be.true;
	});

	it('should report unexpected errors as exceptions when Log_Level is 2', () => {
		const err = new Error('Match error: Expected string, got number');

		logMethodCallError('loadHistory', err);

		expect(debugMock.called).to.be.false;
		expect(errorMock.calledOnce).to.be.true;
		expect(errorMock.calledWithExactly({ msg: 'Exception while invoking method', err, method: 'loadHistory' })).to.be.true;
		expect(meteorDebugMock.calledOnce).to.be.true;
		expect(meteorDebugMock.calledWithExactly('Exception while invoking method loadHistory', err)).to.be.true;
	});

	it('should report unexpected errors without notifying the exceptions channel when Log_Level is not 2', () => {
		settingsGetMock.withArgs('Log_Level').returns('0');

		const err = new Error('Match error: Expected string, got number');

		logMethodCallError('loadHistory', err);

		expect(debugMock.called).to.be.false;
		expect(errorMock.calledOnce).to.be.true;
		expect(errorMock.calledWithExactly({ msg: 'Exception while invoking method', err, method: 'loadHistory' })).to.be.true;
		expect(meteorDebugMock.called).to.be.false;
	});
});
