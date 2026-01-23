import { expect } from 'chai';
import { describe, it, beforeEach, after } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const workOnPdfStub = sinon.stub();
const queueWorkStub = sinon.stub();

const { requestPdfTranscript } = proxyquire
	.noCallThru()
	.load('../../../../../ee/app/livechat-enterprise/server/lib/requestPdfTranscript.ts', {
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
	it('should not allow to request a transcript if it already exists', async () => {
		const result = await requestPdfTranscript({ _id: 'roomIdxx', v: 1, pdfTranscriptFileId: 'afsdafadsfs' }, 'userId');
		expect(result).to.be.undefined;
	});
	it('should not allow to request a transcript if it was already requested during the previous 15 seconds', async () => {
		await requestPdfTranscript({ _id: 'roomId', v: 1 }, 'userId');
		expect(workOnPdfStub.callCount).to.equal(0);
		expect(queueWorkStub.callCount).to.equal(1);

		const result = await requestPdfTranscript({ _id: 'roomId', v: 1 }, 'userId');
		expect(workOnPdfStub.callCount).to.equal(0);
		expect(queueWorkStub.callCount).to.equal(1);
		expect(result).to.be.undefined;
	});
	it('should call workOnPdf if TEST_MODE is true', async () => {
		process.env.TEST_MODE = 'true';
		await requestPdfTranscript({ _id: 'roomId-fasdafsdas', v: {} }, 'userId');
		expect(
			workOnPdfStub
				.getCall(0)
				.calledWithExactly({ details: { rid: 'roomId-fasdafsdas', userId: 'userId', from: 'omnichannel-transcript' } }),
		).to.be.true;
		expect(queueWorkStub.calledOnce).to.be.false;
	});
	it('should queue work if TEST_MODE is not set', async () => {
		delete process.env.TEST_MODE;
		await requestPdfTranscript({ _id: 'roomId-afsdfaefzv', v: {} }, 'userId');
		expect(workOnPdfStub.calledOnce).to.be.false;
		expect(
			queueWorkStub.getCall(0).calledWithExactly('work', 'omnichannel-transcript.workOnPdf', {
				details: { rid: 'roomId-afsdfaefzv', userId: 'userId', from: 'omnichannel-transcript' },
			}),
		).to.be.true;
	});
});
