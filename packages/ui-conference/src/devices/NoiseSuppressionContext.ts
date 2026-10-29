import { createRequiredContext } from '@rocket.chat/ui-media';

import type { NoiseMethod } from '../hooks/useCallDevicesInitialState';

/**
 * How the microphone is cleaned up, for the microphone menus. The preflight fills it with the stored preference; a
 * call running in this window, with what its microphone track is running.
 */
export type NoiseSuppressionSelection = {
	method: NoiseMethod;
	/** What this browser can run, weakest first. */
	methods: NoiseMethod[];
	pending: boolean;
	select: (method: NoiseMethod) => void;
};

export const [NoiseSuppressionProvider, useNoiseSuppressionSelection] =
	createRequiredContext<NoiseSuppressionSelection>('NoiseSuppression');

/** Whether this browser can run RNNoise, which needs an AudioWorklet to run its WebAssembly in. */
export const supportsRnnoise = (): boolean => typeof AudioWorkletNode !== 'undefined' && typeof WebAssembly !== 'undefined';
