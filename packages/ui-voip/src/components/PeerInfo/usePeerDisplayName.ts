import { useTranslation } from 'react-i18next';

import { type PeerInfo, usePeekMediaSessionPeerInfo } from '../../context';
import { isExternalPeer } from '../../utils/isExternalPeer';

export const getPeerDisplayName = (t: ReturnType<typeof useTranslation>['t'], peerInfo?: PeerInfo): string => {
	if (peerInfo) {
		if (peerInfo.displayName) {
			return peerInfo.displayName;
		}

		if (isExternalPeer(peerInfo)) {
			return peerInfo.number;
		}
	}

	return t('Unknown');
};

export const usePeerDisplayName = (): string => {
	const { t } = useTranslation();
	const peerInfo = usePeekMediaSessionPeerInfo();

	return getPeerDisplayName(t, peerInfo);
};
