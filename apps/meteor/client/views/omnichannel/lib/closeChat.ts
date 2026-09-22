/**
 * The rules for closing an omnichannel chat: which transcripts the agent may offer, and what the
 * request looks like once they have chosen.
 */

export type CloseChatTranscriptPreferences = {
	omnichannelTranscriptPDF: boolean;
	omnichannelTranscriptEmail: boolean;
};

export type CloseChatTranscriptRequestData = {
	email: string;
	subject: string;
};

export type CloseChatEntitlementsInput = {
	canRequestPdfTranscript: boolean;
	canSendChatTranscript: boolean;
	hasLicense: boolean;
	alwaysSendTranscript: boolean;
	hasVisitorEmail: boolean;
};

export type CloseChatEntitlements = {
	canSendTranscriptEmail: boolean;
	canSendTranscriptPDF: boolean;
	canSendTranscript: boolean;
};

export type CloseChatRequestInput = {
	rid: string;
	comment?: string;
	tags?: string[];
	preferences?: CloseChatTranscriptPreferences;
	requestData?: CloseChatTranscriptRequestData;
};

export type CloseChatRequest = {
	rid: string;
	comment?: string;
	tags?: string[];
	generateTranscriptPdf?: true;
	transcriptEmail: { sendToVisitor: false } | { sendToVisitor: true; requestData: CloseChatTranscriptRequestData };
};

export const getCloseChatEntitlements = ({
	canRequestPdfTranscript,
	canSendChatTranscript,
	hasLicense,
	alwaysSendTranscript,
	hasVisitorEmail,
}: CloseChatEntitlementsInput): CloseChatEntitlements => {
	// A transcript the workspace always sends is not a choice to offer, and there is nowhere to email one without an address.
	const canSendTranscriptEmail = canSendChatTranscript && hasVisitorEmail && !alwaysSendTranscript;
	const canSendTranscriptPDF = canRequestPdfTranscript && hasLicense;

	return {
		canSendTranscriptEmail,
		canSendTranscriptPDF,
		canSendTranscript: canSendTranscriptEmail || canSendTranscriptPDF,
	};
};

export const buildCloseChatRequest = ({ rid, comment, tags, preferences, requestData }: CloseChatRequestInput): CloseChatRequest => ({
	rid,
	...(comment && { comment }),
	...(tags && { tags }),
	...(preferences?.omnichannelTranscriptPDF && { generateTranscriptPdf: true as const }),
	...(preferences?.omnichannelTranscriptEmail && requestData
		? { transcriptEmail: { sendToVisitor: true as const, requestData } }
		: { transcriptEmail: { sendToVisitor: false as const } }),
});
