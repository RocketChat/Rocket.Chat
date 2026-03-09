import type { Keys as IconNames } from '@rocket.chat/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { PeerInfo } from '../context';
import { usePeekMediaSessionPeerInfo } from '../context/usePeekMediaSessionPeerInfo';
import { usePeekMediaSessionState } from '../context/usePeekMediaSessionState';
import { useWidgetExternalControls } from '../context/useWidgetExternalControls';

export const useMediaCallAction = (
	callee?: PeerInfo,
): { title: string; icon: IconNames; action: (callee?: PeerInfo) => void } | undefined => {
	const { t } = useTranslation();

	const { toggleWidget, endCall } = useWidgetExternalControls();
	const state = usePeekMediaSessionState();
	const peerInfo = usePeekMediaSessionPeerInfo();

	return useMemo(() => {
		if (state === 'unavailable') {
			return undefined;
		}

		const getDisplayName = (peerInfo: { displayName?: string; number?: string }) => {
			return 'displayName' in peerInfo ? peerInfo?.displayName : peerInfo?.number;
		};

		if (state === 'ongoing' && peerInfo) {
			return {
				title: t('Voice_call__user__hangup', { user: getDisplayName(peerInfo) }),
				icon: 'phone-off',
				action: () => endCall(),
			};
		}

		if (state === 'calling' && peerInfo) {
			return {
				title: t('Voice_call__user__cancel', { user: getDisplayName(peerInfo) }),
				icon: 'phone-off',
				action: () => endCall(),
			};
		}

		if (state === 'ringing' && peerInfo) {
			return {
				title: t('Voice_call__user__reject', { user: getDisplayName(peerInfo) }),
				icon: 'phone-off',
				action: () => endCall(),
			};
		}

		if (callee) {
			return {
				title: t('Voice_call__user_', { user: getDisplayName(callee) }),
				icon: 'phone',
				action: () => toggleWidget(callee),
			};
		}

		return {
			title: t('New_voice_call'),
			icon: 'dialpad' as const,
			action: () => toggleWidget(undefined),
		};
	}, [state, t, peerInfo, callee, toggleWidget, endCall]);
};
