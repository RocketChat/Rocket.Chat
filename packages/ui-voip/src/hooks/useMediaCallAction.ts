import type { Keys as IconNames } from '@rocket.chat/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { PeerInfo } from '../context';
import { useMediaCallExternalContext } from '../context';

export const useMediaCallAction = (
	callee?: PeerInfo,
): { title: string; icon: IconNames; action: (callee?: PeerInfo) => void } | undefined => {
	const { t } = useTranslation();

	const { state, onToggleWidget, onEndCall, peerInfo } = useMediaCallExternalContext();

	return useMemo(() => {
		if (state === 'unauthorized') {
			return undefined;
		}

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

		if (callee) {
			return {
				title: t('Voice_call__user_', { user: getDisplayName(callee) }),
				icon: 'phone',
				action: () => onToggleWidget(callee),
			};
		}

		return {
			title: t('New_voice_call'),
			icon: 'dialpad',
			action: () => onToggleWidget(),
		};
	}, [state, peerInfo, callee, t, onEndCall, onToggleWidget]);
};
