import type { CloseChatEntitlementsInput } from './closeChat';
import { buildCloseChatRequest, getCloseChatEntitlements, getCloseChatTranscriptChoice } from './closeChat';

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

	it('offers a transcript when only the PDF one is allowed', () => {
		expect(entitlements({ canSendChatTranscript: false }).canSendTranscript).toBe(true);
	});

	it('offers a transcript when only the email one is allowed', () => {
		expect(entitlements({ hasLicense: false }).canSendTranscript).toBe(true);
	});

	it('offers no transcript when neither is allowed', () => {
		expect(entitlements({ hasLicense: false, canSendChatTranscript: false }).canSendTranscript).toBe(false);
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

describe('getCloseChatTranscriptChoice', () => {
	const choice = {
		alwaysSendTranscript: false,
		transcriptPDF: false,
		transcriptEmail: false,
		visitorEmail: 'visitor@example.com',
		subject: 'Your chat',
	};

	it('records only what the agent ticked', () => {
		expect(getCloseChatTranscriptChoice({ ...choice, transcriptPDF: true })).toEqual({
			preferences: { omnichannelTranscriptPDF: true, omnichannelTranscriptEmail: false },
		});
	});

	it('counts the email transcript as chosen when the workspace always sends it', () => {
		expect(getCloseChatTranscriptChoice({ ...choice, alwaysSendTranscript: true }).preferences.omnichannelTranscriptEmail).toBe(true);
	});

	it('addresses the email transcript to the visitor with the subject typed', () => {
		expect(getCloseChatTranscriptChoice({ ...choice, transcriptEmail: true }).requestData).toEqual({
			email: 'visitor@example.com',
			subject: 'Your chat',
		});
	});

	it('has nowhere to send the email transcript without an address', () => {
		expect(getCloseChatTranscriptChoice({ ...choice, transcriptEmail: true, visitorEmail: undefined }).requestData).toBeUndefined();
	});
});
