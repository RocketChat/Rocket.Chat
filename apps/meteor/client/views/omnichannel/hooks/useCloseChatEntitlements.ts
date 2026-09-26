import { usePermission, useSetting } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import type { CloseChatEntitlements } from '../lib/closeChat';
import { getCloseChatEntitlements } from '../lib/closeChat';

/** Answers which transcripts the agent closing this chat may offer the visitor. */
export const useCloseChatEntitlements = (visitorEmail?: string): CloseChatEntitlements => {
	const alwaysSendTranscript = useSetting('Livechat_transcript_send_always', false);
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	return getCloseChatEntitlements({
		canRequestPdfTranscript: usePermission('request-pdf-transcript'),
		canSendChatTranscript: usePermission('send-omnichannel-chat-transcript'),
		hasLicense,
		alwaysSendTranscript,
		hasVisitorEmail: Boolean(visitorEmail),
	});
};
