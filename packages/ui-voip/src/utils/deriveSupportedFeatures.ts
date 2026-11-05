import { callControlFeatureList } from '@rocket.chat/media-signaling';
import type { CallFeature, CallService } from '@rocket.chat/media-signaling';

/**
 * The features the widget should treat as available for a call.
 *
 * Only calls controlled by an app choose their control buttons; on any other call those buttons
 * have always been shown, so they stay on without the call having to list them.
 */
export const deriveSupportedFeatures = (service: CallService | null, features: readonly CallFeature[]): readonly CallFeature[] => {
	if (service === 'cti') {
		return features;
	}

	return [...new Set([...features, ...callControlFeatureList])];
};
