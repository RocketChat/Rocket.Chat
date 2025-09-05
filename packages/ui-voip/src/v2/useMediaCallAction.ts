import type { Keys as IconNames } from '@rocket.chat/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaCallContext } from './MediaCallContext';

export const useMediaCallAction = (): { title: string; icon: IconNames; action: () => void; loading?: boolean } => {
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
				title: t('Voice_call__user__incoming', { user: getDisplayName(peerInfo) }),
				icon: 'phone-off',
				loading: true,
				action: () => undefined, // TODO
			};
		}

		return {
			title: t('New_voice_call'),
			// TODO: use phone-plus when it's available in fuselage
			// icon: 'phone-plus',
			icon: 'phone-out',
			action: () => onToggleWidget(),
		};
	}, [onEndCall, onToggleWidget, peerInfo, state, t]);
};
