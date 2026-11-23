import type { Keys as IconNames } from '@rocket.chat/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getPeerDisplayName } from '../components/PeerInfo/usePeerDisplayName.js';
import type { PeerInfo } from '../context/index.js';
import { usePeekMediaSessionPeerInfo } from '../context/usePeekMediaSessionPeerInfo.js';
import { usePeekMediaSessionState } from '../context/usePeekMediaSessionState.js';
import { useWidgetExternalControls } from '../context/useWidgetExternalControls.js';

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

		if (state === 'ongoing' && peerInfo) {
			return {
				title: t('Voice_call__user__hangup', { user: getPeerDisplayName(t, peerInfo) }),
				icon: 'phone-off',
				action: () => endCall(),
			};
		}

		if (state === 'calling' && peerInfo) {
			return {
				title: t('Voice_call__user__cancel', { user: getPeerDisplayName(t, peerInfo) }),
				icon: 'phone-off',
				action: () => endCall(),
			};
		}

		if (state === 'ringing' && peerInfo) {
			return {
				title: t('Voice_call__user__reject', { user: getPeerDisplayName(t, peerInfo) }),
				icon: 'phone-off',
				action: () => endCall(),
			};
		}

		if (callee) {
			return {
				title: t('Voice_call__user_', { user: getPeerDisplayName(t, callee) }),
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
