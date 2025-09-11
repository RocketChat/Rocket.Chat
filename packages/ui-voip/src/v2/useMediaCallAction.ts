import type { Keys as IconNames } from '@rocket.chat/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { PeerInfo, useMediaCallContext } from './MediaCallContext';

export const useMediaCallAction = (direct = false): { title: string; icon: IconNames; action: (callee?: PeerInfo) => void } => {
	const { t } = useTranslation();

	const { state, onToggleWidget, onEndCall, peerInfo } = useMediaCallContext();

	return useMemo(() => {
		const getDisplayName = (peerInfo: { displayName?: string; number?: string }) => {
			return 'displayName' in peerInfo ? peerInfo?.displayName : peerInfo?.number;
		};

		if (state === 'ongoing' && peerInfo) {
			return {
				title: t('Voice_call__user__hangup', { user: getDisplayName(peerInfo) }),
				icon: 'phone-off',
				action: () => onEndCall(),
			};
		}

		if (state === 'calling' && peerInfo) {
			return {
				title: t('Voice_call__user__cancel', { user: getDisplayName(peerInfo) }),
				icon: 'phone-off',
				action: () => onEndCall(),
			};
		}

		if (state === 'ringing' && peerInfo) {
			return {
				title: t('Voice_call__user__reject', { user: getDisplayName(peerInfo) }),
				icon: 'phone-off',
				action: () => onEndCall(),
			};
		}

		return {
			title: t('New_voice_call'),
			icon: direct ? 'dialpad' : 'phone-out',
			action: (callee?: PeerInfo) => onToggleWidget(callee),
		};
	}, [direct, onEndCall, onToggleWidget, peerInfo, state, t]);
};
