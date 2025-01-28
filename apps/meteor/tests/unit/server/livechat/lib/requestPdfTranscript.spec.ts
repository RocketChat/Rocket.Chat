import { expect } from 'chai';
import { describe, it, beforeEach, after } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const setStub = sinon.stub();
const workOnPdfStub = sinon.stub();
const queueWorkStub = sinon.stub();

const { requestPdfTranscript } = proxyquire
	.noCallThru()
	.load('../../../../../ee/app/livechat-enterprise/server/lib/requestPdfTranscript.ts', {
		'@rocket.chat/models': {
			LivechatRooms: {
				setTranscriptRequestedPdfById: setStub,
			},
		},
		'@rocket.chat/core-services': {
			OmnichannelTranscript: {
				workOnPdf: workOnPdfStub,
			},
			QueueWorker: {
				queueWork: queueWorkStub,
			},
		},
	});

describe('requestPdfTranscript', () => {
	const currentTestModeValue = process.env.TEST_MODE;

	beforeEach(() => {
		setStub.reset();
		workOnPdfStub.reset();
		queueWorkStub.reset();
	});

	after(() => {
		process.env.TEST_MODE = currentTestModeValue;
	});

	it('should throw an error if room is still open', async () => {
		await expect(requestPdfTranscript({ open: true }, 'userId')).to.be.rejectedWith('room-still-open');
	});
	it('should throw an error if room doesnt have a v property', async () => {
		await expect(requestPdfTranscript({}, 'userId')).to.be.rejectedWith('improper-room-state');
	});
	it('should not request a transcript if it was already requested', async () => {
		await requestPdfTranscript({ v: 1, pdfTranscriptRequested: true }, 'userId');
		expect(setStub.callCount).to.equal(0);
		expect(workOnPdfStub.callCount).to.equal(0);
		expect(queueWorkStub.callCount).to.equal(0);
	});
	it('should set pdfTranscriptRequested to true on room', async () => {
		await requestPdfTranscript({ _id: 'roomId', v: {}, pdfTranscriptRequested: false }, 'userId');
		expect(setStub.calledWith('roomId')).to.be.true;
	});
	it('should call workOnPdf if TEST_MODE is true', async () => {
		process.env.TEST_MODE = 'true';
		await requestPdfTranscript({ _id: 'roomId', v: {} }, 'userId');
		expect(workOnPdfStub.getCall(0).calledWithExactly({ details: { rid: 'roomId', userId: 'userId', from: 'omnichannel-transcript' } })).to
			.be.true;
		expect(queueWorkStub.calledOnce).to.be.false;
	});
	it('should queue work if TEST_MODE is not set', async () => {
		delete process.env.TEST_MODE;
		await requestPdfTranscript({ _id: 'roomId', v: {} }, 'userId');
		expect(workOnPdfStub.calledOnce).to.be.false;
		expect(
			queueWorkStub.getCall(0).calledWithExactly('work', 'omnichannel-transcript.workOnPdf', {
				details: { rid: 'roomId', userId: 'userId', from: 'omnichannel-transcript' },
			}),
		).to.be.true;
	});
});
