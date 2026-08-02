import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import { AnnouncementBanner } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ChatAccessModal from './ChatAccessModal';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';

type ChatAccessNoticeProps = {
	callId: string;
	access: ConferenceChatAccess;
};

// The banner itself isn't the control here — the Review button is — so undo the affordances
// `AnnouncementBanner` shows for the clickable case.
const notInteractive = css`
	cursor: default;
	&:hover {
		text-decoration: none;
	}
`;

/**
 * Being added to a conference grants no room access, so some members can be in the call without being able
 * to read its chat. Rather than forcing that choice on whoever adds them, it is surfaced here once it
 * matters, with the ways to resolve it and their consequences a click away.
 */
const ChatAccessNotice = ({ callId, access }: ChatAccessNoticeProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	if (!access.members.length) {
		return null;
	}

	return (
		<AnnouncementBanner className={notInteractive}>
			<Box display='flex' alignItems='center' justifyContent='space-between'>
				<Box withTruncatedText>{t('__count__participants_cannot_see_the_chat', { count: access.members.length })}</Box>
				<Button
					small
					flexShrink={0}
					onClick={() => setModal(<ChatAccessModal callId={callId} access={access} onClose={() => setModal(null)} />)}
				>
					{t('Review')}
				</Button>
			</Box>
		</AnnouncementBanner>
	);
};

export default ChatAccessNotice;
