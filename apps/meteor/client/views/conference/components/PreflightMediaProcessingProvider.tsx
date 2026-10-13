import {
	activateVirtualBackground,
	deactivateVirtualBackground,
	getVirtualBackgroundSnapshot,
	selectVirtualBackground,
	subscribeVirtualBackground,
	supportsBackgroundBlur,
} from '@rocket.chat/media-processors';
import type { BlurLevel, BlurModel, CallMediaProcessing, NoiseMethod } from '@rocket.chat/ui-conference';
import { CallMediaProcessingProvider, useBackgroundBlurPreference, useNoiseSuppressionPreference } from '@rocket.chat/ui-conference';
import type { ReactNode } from 'react';
import { useMemo, useSyncExternalStore } from 'react';

const NOISE_METHODS: NoiseMethod[] = ['none', 'browser', 'rnnoise'];
const BLUR_LEVELS: BlurLevel[] = ['none', 'light', 'medium', 'strong'];
const BLUR_MODELS: readonly BlurModel[] = ['quality', 'performance'];

type PreflightMediaProcessingProviderProps = { children: ReactNode };

/**
 * What the preflight's device menus offer to do to the microphone and the camera: every choice, recorded for the call
 * to apply, while the preview shows the camera's with the same processor.
 */
const PreflightMediaProcessingProvider = ({ children }: PreflightMediaProcessingProviderProps) => {
	const { noiseMethod, selectNoiseMethod } = useNoiseSuppressionPreference();
	const { blurLevel, selectBlurLevel, blurModel, selectBlurModel } = useBackgroundBlurPreference();
	const virtualBackground = useSyncExternalStore(subscribeVirtualBackground, getVirtualBackgroundSnapshot);
	const canReplaceBackground = useMemo(supportsBackgroundBlur, []);

	const value = useMemo(
		(): CallMediaProcessing => ({
			noiseSuppression: { methods: NOISE_METHODS, method: noiseMethod, pending: false, select: selectNoiseMethod },
			backgroundBlur: {
				available: true,
				level: blurLevel,
				levels: BLUR_LEVELS,
				// The preview always segments here: the camera's own blur is only asked for once in a call.
				blur: 'processor',
				pending: false,
				model: blurModel,
				models: BLUR_MODELS,
				select: (level) => {
					deactivateVirtualBackground();
					selectBlurLevel(level);
				},
				selectModel: selectBlurModel,
				backgroundImage: {
					available: canReplaceBackground,
					active: virtualBackground.active,
					hasImage: Boolean(virtualBackground.image),
					name: virtualBackground.name,
					select: (file) =>
						selectVirtualBackground(file)
							.then(() => selectBlurLevel('none'))
							.catch((err: unknown) => console.warn('virtual background image could not be selected', err)),
					activate: () => {
						selectBlurLevel('none');
						activateVirtualBackground();
					},
				},
			},
		}),
		[noiseMethod, selectNoiseMethod, blurLevel, selectBlurLevel, blurModel, selectBlurModel, canReplaceBackground, virtualBackground],
	);

	return <CallMediaProcessingProvider value={value}>{children}</CallMediaProcessingProvider>;
};

export default PreflightMediaProcessingProvider;
