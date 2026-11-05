import type { Keys as IconNames } from '@rocket.chat/icons';
import { useUser } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getPeerDisplayName } from '../components/PeerInfo/usePeerDisplayName';
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
	// PoC: only users with an assigned extension may start calls
	const hasSipExtension = Boolean(useUser()?.sipExtension);

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

		if (!hasSipExtension) {
			return undefined;
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
	}, [state, t, peerInfo, hasSipExtension, callee, toggleWidget, endCall]);
};
