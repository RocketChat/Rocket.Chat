import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { NoiseMethod, NoiseSuppressionSelection } from '@rocket.chat/ui-conference';
import { supportsRnnoise, useNoiseSuppressionPreference } from '@rocket.chat/ui-conference';
import type { AudioCaptureOptions, LocalAudioTrack, Room } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';

import { RnnoiseProcessor } from './rnnoiseProcessor';

/** Weakest first, the order the microphone menu offers them in. */
const ORDER: NoiseMethod[] = ['none', 'browser', 'rnnoise'];

/** A remembered RNNoise this browser cannot run is the browser's filter, rather than a failed start on every microphone. */
const runnable = (method: NoiseMethod): NoiseMethod => (method === 'rnnoise' && !supportsRnnoise() ? 'browser' : method);

const warn = (err: unknown) => console.warn('the microphone would not change noise cancellation', err);

/** The browser's own filter is a property of the capture, so changing it reopens the microphone. */
const setBrowserFilter = async (track: LocalAudioTrack, enabled: boolean) => {
	if (track.mediaStreamTrack.getSettings().noiseSuppression === enabled) {
		return;
	}
	// Every constraint the track has, since the ones passed replace them all: without the device, the restart opens
	// the browser's default microphone.
	await track.restartTrack({ ...track.constraints, noiseSuppression: enabled } as AudioCaptureOptions);
};

/**
 * Puts `method` in circuit and takes whatever was there out. RNNoise runs on the raw microphone, never on top of the
 * browser's filter: two suppressors in a row eat into the voice.
 */
const applyMethod = async (track: LocalAudioTrack, method: NoiseMethod, rnnoiseBaseUrl: string) => {
	if (track.getProcessor()) {
		await track.stopProcessor();
	}
	await setBrowserFilter(track, method === 'browser');
	if (method === 'rnnoise') {
		await track.setProcessor(new RnnoiseProcessor(rnnoiseBaseUrl));
	}
};

/**
 * How the microphone is cleaned up, and how to change it.
 *
 * RNNoise that cannot start falls back to the browser's filter, so the reader is never left with less than they had
 * before asking. A choice is remembered once the microphone took it, like the camera's resolution.
 */
export const useNoiseSuppression = (
	room: Room,
	audioTrack: LocalAudioTrack | undefined,
	rnnoiseBaseUrl: string,
): NoiseSuppressionSelection => {
	const { noiseMethod: preferred, selectNoiseMethod } = useNoiseSuppressionPreference();
	const [method, setMethod] = useState(() => runnable(preferred));
	const [pending, setPending] = useState(false);
	// Only a failure the reader asked for hides it: one at the start of the call may be the browser holding audio back
	// until a click, which choosing it from the menu is.
	const [rnnoiseFailed, setRnnoiseFailed] = useState(false);

	// The room opens every new microphone with its capture defaults, so one opened for RNNoise is not filtered twice.
	useEffect(() => {
		room.options.audioCaptureDefaults = { ...room.options.audioCaptureDefaults, noiseSuppression: runnable(preferred) === 'browser' };
	}, [room, preferred]);

	// Only the latest change reports back: one still finishing on a microphone since replaced must not settle the menu.
	const latest = useRef(0);

	const apply = useStableCallback(async (track: LocalAudioTrack, next: NoiseMethod) => {
		const request = ++latest.current;
		setPending(true);
		try {
			let running = next;
			try {
				await applyMethod(track, next, rnnoiseBaseUrl);
			} catch (err) {
				if (next !== 'rnnoise') {
					throw err;
				}
				warn(err);
				await applyMethod(track, 'browser', rnnoiseBaseUrl);
				running = 'browser';
			}
			return { running, current: request === latest.current };
		} finally {
			if (request === latest.current) {
				setPending(false);
			}
		}
	});

	// A new microphone gets the remembered choice; a change of choice is `select`'s to apply.
	const start = useStableCallback((track: LocalAudioTrack) => apply(track, runnable(preferred)));

	// A microphone being replaced has its change outrun by the next one's.
	const abandon = useStableCallback(() => {
		latest.current++;
		setPending(false);
	});

	useEffect(() => {
		if (!audioTrack) {
			return;
		}

		start(audioTrack).then(({ running, current }) => current && setMethod(running), warn);

		return abandon;
	}, [audioTrack, start, abandon]);

	const select = useStableCallback((next: NoiseMethod) => {
		if (pending || next === method) {
			return;
		}
		if (!audioTrack) {
			setMethod(next);
			selectNoiseMethod(next);
			return;
		}
		apply(audioTrack, next).then(({ running, current }) => {
			if (!current) {
				return;
			}
			setMethod(running);
			if (running === next) {
				selectNoiseMethod(next);
				return;
			}
			setRnnoiseFailed(true);
		}, warn);
	});

	const methods = useMemo(
		() => ORDER.filter((candidate) => candidate !== 'rnnoise' || (!rnnoiseFailed && supportsRnnoise())),
		[rnnoiseFailed],
	);

	return useMemo(() => ({ method, methods, pending, select }), [method, methods, pending, select]);
};
