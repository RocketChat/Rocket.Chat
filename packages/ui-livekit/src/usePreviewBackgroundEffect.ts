import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { BackgroundEffect, BackgroundEffectSelection } from '@rocket.chat/ui-conference';
import { isSameBackgroundEffect, useBackgroundPreference } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack } from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';

import { effectFor, preferenceFor, usePresetBackgrounds } from './presetBackgrounds';
import { useTrackBackgroundEffect } from './useTrackBackgroundEffect';

const NO_URLS: string[] = [];
const NO_IMAGES: string[] = [];

/**
 * What is behind the reader in the preflight's camera, starting from what they chose last time; what they choose is
 * remembered for the call to arrive with. No uploads, since an image added here would not reach the call.
 */
export const usePreviewBackgroundEffect = (track: LocalVideoTrack | undefined, segmentationBaseUrl: string): BackgroundEffectSelection => {
	const { current, applying, supported, change } = useTrackBackgroundEffect(track, segmentationBaseUrl);
	const { background: remembered, selectBackground } = useBackgroundPreference();
	const presetBackgrounds = usePresetBackgrounds();
	const presets = useMemo(() => presetBackgrounds?.map(({ url }) => url) ?? NO_URLS, [presetBackgrounds]);

	// Taken once, when the presets it may name are known; from then on the choices made here lead.
	const [started, setStarted] = useState(false);
	useEffect(() => {
		if (started) {
			return;
		}
		const effect = effectFor(remembered, presetBackgrounds);
		if (!effect) {
			return;
		}
		setStarted(true);
		if (!isSameBackgroundEffect(effect, current)) {
			void change(effect);
		}
	}, [current, started, remembered, presetBackgrounds, change]);

	const select = useStableCallback((next: BackgroundEffect) => {
		if (applying || isSameBackgroundEffect(next, current) || (next.mode === 'image' && !presets.includes(next.imageUrl))) {
			return;
		}
		// Remembered only once it is on the camera, so the call never arrives with an effect the preview could not show.
		void change(next).then((landed) => landed && selectBackground(preferenceFor(next, presetBackgrounds)));
	});

	const cameraSource = track?.mediaStream;

	return useMemo(
		() => ({ current, applying, presets, images: NO_IMAGES, supported, cameraSource, select }),
		[current, applying, presets, supported, cameraSource, select],
	);
};
