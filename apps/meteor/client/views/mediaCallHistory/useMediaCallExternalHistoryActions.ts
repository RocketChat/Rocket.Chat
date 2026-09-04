import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useGoToDirectMessage } from '@rocket.chat/ui-client';
import { useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useWidgetExternalControls, usePeekMediaSessionState } from '@rocket.chat/ui-voip';
import type { CallHistoryExternalContact, CallHistoryUnknownContact } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

type UseMediaCallExternalHistoryActionsBaseOptions = {
	contact: CallHistoryExternalContact | CallHistoryUnknownContact;
	openUserInfo?: (userId: string) => void;
};

export const useMediaCallExternalHistoryActions = ({ contact, openUserInfo }: UseMediaCallExternalHistoryActionsBaseOptions) => {
	const state = usePeekMediaSessionState();
	const { toggleWidget } = useWidgetExternalControls();

	const getAvatarUrl = useUserAvatarPath();

	const voiceCall = useStableCallback(() => {
		if (state !== 'available') {
			return;
		}

		if ('number' in contact && contact.number) {
			toggleWidget(contact);
		} else if ('uid' in contact && contact.uid && contact.username) {
			toggleWidget({
				userId: contact.uid,
				displayName: contact.name || contact.username || '',
				username: contact.username,
				avatarUrl: getAvatarUrl({ username: contact.username }),
				...(contact.number && { callerId: contact.number }),
			});
		}
	});

	const goToDirectMessage = useGoToDirectMessage({ username: 'username' in contact ? contact.username : '' }, '');

	const userInfo = useStableCallback(() => {
		if (!openUserInfo) {
			return;
		}
		if (!('uid' in contact) || !contact.uid) {
			return;
		}
		openUserInfo(contact.uid);
	});

	return useMemo(
		() => ({
			voiceCall: ('number' in contact && contact.number) || ('uid' in contact && contact.uid && contact.username) ? voiceCall : undefined,
			directMessage: 'username' in contact && contact.username ? goToDirectMessage : undefined,
			userInfo: openUserInfo && 'uid' in contact && contact.uid ? () => userInfo() : undefined,
		}),
		[voiceCall, goToDirectMessage, openUserInfo, userInfo, contact],
	);
};
