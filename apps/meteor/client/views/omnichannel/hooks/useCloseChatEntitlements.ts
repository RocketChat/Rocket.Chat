import { useHasLicenseModule } from '@rocket.chat/ui-client';
import { usePermission, useSetting } from '@rocket.chat/ui-contexts';

import type { CloseChatEntitlements } from '../lib/closeChat';
import { getCloseChatEntitlements } from '../lib/closeChat';

/** Answers which transcripts the agent closing this chat may offer the visitor, and whether the workspace sends one anyway. */
export const useCloseChatEntitlements = (visitorEmail?: string): CloseChatEntitlements & { alwaysSendTranscript: boolean } => {
	const alwaysSendTranscript = useSetting('Livechat_transcript_send_always', false);
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	const canRequestPdfTranscript = usePermission('request-pdf-transcript');
	const canSendChatTranscript = usePermission('send-omnichannel-chat-transcript');

	return {
		...getCloseChatEntitlements({
			canRequestPdfTranscript,
			canSendChatTranscript,
			hasLicense,
			alwaysSendTranscript,
			hasVisitorEmail: Boolean(visitorEmail),
		}),
		alwaysSendTranscript,
	};
};
