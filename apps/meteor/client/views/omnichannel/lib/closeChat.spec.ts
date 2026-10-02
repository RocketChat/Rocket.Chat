import type { CloseChatEntitlementsInput } from './closeChat';
import { buildCloseChatRequest, getCloseChatEntitlements } from './closeChat';

const entitlements = (overrides: Partial<CloseChatEntitlementsInput> = {}) =>
	getCloseChatEntitlements({
		canRequestPdfTranscript: true,
		canSendChatTranscript: true,
		hasLicense: true,
		alwaysSendTranscript: false,
		hasVisitorEmail: true,
		...overrides,
	});

describe('getCloseChatEntitlements', () => {
	it('offers both transcripts to an agent allowed both', () => {
		expect(entitlements()).toEqual({ canSendTranscriptEmail: true, canSendTranscriptPDF: true, canSendTranscript: true });
	});

	it('offers no email transcript without an address to send it to', () => {
		expect(entitlements({ hasVisitorEmail: false }).canSendTranscriptEmail).toBe(false);
	});

	it('offers no email transcript when the workspace sends one anyway', () => {
		expect(entitlements({ alwaysSendTranscript: true }).canSendTranscriptEmail).toBe(false);
	});

	it('offers no PDF transcript without the licence', () => {
		expect(entitlements({ hasLicense: false }).canSendTranscriptPDF).toBe(false);
	});

	it('offers nothing at all when neither kind is available', () => {
		expect(entitlements({ hasLicense: false, hasVisitorEmail: false }).canSendTranscript).toBe(false);
	});
});

describe('buildCloseChatRequest', () => {
	it('closes a chat with nothing but the room', () => {
		expect(buildCloseChatRequest({ rid: 'rid' })).toEqual({ rid: 'rid', transcriptEmail: { sendToVisitor: false } });
	});

	it('carries the comment and the tags when they were given', () => {
		expect(buildCloseChatRequest({ rid: 'rid', comment: 'done', tags: ['sales'] })).toMatchObject({
			comment: 'done',
			tags: ['sales'],
		});
	});

	it('asks for the PDF only when the preference says so', () => {
		const preferences = { omnichannelTranscriptPDF: true, omnichannelTranscriptEmail: false };

		expect(buildCloseChatRequest({ rid: 'rid', preferences }).generateTranscriptPdf).toBe(true);
		expect(buildCloseChatRequest({ rid: 'rid' })).not.toHaveProperty('generateTranscriptPdf');
	});

	it('emails the visitor only when the preference and the address agree', () => {
		const preferences = { omnichannelTranscriptPDF: false, omnichannelTranscriptEmail: true };
		const requestData = { email: 'visitor@example.com', subject: 'Your chat' };

		expect(buildCloseChatRequest({ rid: 'rid', preferences, requestData }).transcriptEmail).toEqual({
			sendToVisitor: true,
			requestData,
		});
	});

	it('does not email the visitor when the preference is on but nothing was asked for', () => {
		const preferences = { omnichannelTranscriptPDF: false, omnichannelTranscriptEmail: true };

		expect(buildCloseChatRequest({ rid: 'rid', preferences }).transcriptEmail).toEqual({ sendToVisitor: false });
	});
});
