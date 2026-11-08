import type { CallFeature } from '@rocket.chat/media-signaling';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useAllowedFeatures = (supportedFeatures: readonly CallFeature[]): readonly CallFeature[] => {
	const allowScreenShare = usePermission('allow-screen-share-voice-calls');

	return useMemo(
		() =>
			supportedFeatures.filter((feature) => {
				switch (feature) {
					case 'screen-share':
						return allowScreenShare;
					default:
						return true;
				}
			}),
		[supportedFeatures, allowScreenShare],
	);
};
