import { hasJoinedVideoConference } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, IconButton } from '@rocket.chat/fuselage';
import { AnnouncementBanner } from '@rocket.chat/ui-client';
import { useSetModal, useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { hasConferenceChatAccess } from '../../../../../lib/videoConference/chatAccess';
import type { ConferenceChatAccess } from '../../hooks/useConferenceEmbedded';
import ChatAccessModal from '../ChatAccessModal/ChatAccessModal';

type ChatAccessNoticeProps = {
	callId: string;
	access: ConferenceChatAccess;
	onDismiss?: () => void;
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
const ChatAccessNotice = ({ callId, access, onDismiss }: ChatAccessNoticeProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const uid = useUserId();

	// Someone merely invited may never turn up, and telling everyone else about a person who isn't there is
	// noise. The situation only exists once they are in the call and can't read what is being said.
	const present = access.members.filter(hasJoinedVideoConference);

	// Only shown to participants who can act on it: a member who can't read the chat can't share it either.
	if (!present.length || !hasConferenceChatAccess(access, uid)) {
		return null;
	}

	return (
		<AnnouncementBanner className={notInteractive}>
			<Box display='flex' alignItems='center' justifyContent='space-between'>
				<Box withTruncatedText>{t('__count__participants_cannot_see_the_chat', { count: present.length })}</Box>
				<Box display='flex' alignItems='center' flexShrink={0} style={{ gap: 4 }}>
					<Button small onClick={() => setModal(<ChatAccessModal callId={callId} access={access} onClose={() => setModal(null)} />)}>
						{t('Review')}
					</Button>
					{onDismiss && <IconButton small secondary icon='cross' aria-label={t('Dismiss')} onClick={onDismiss} />}
				</Box>
			</Box>
		</AnnouncementBanner>
	);
};

export default ChatAccessNotice;
