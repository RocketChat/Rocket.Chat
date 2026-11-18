import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { BackgroundEffect } from '@rocket.chat/ui-conference';
import { isSameBackgroundEffect } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack } from 'livekit-client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { UnsupportedError, applyBackgroundEffect, supportsBackgroundEffects } from './backgroundProcessor';

const NO_EFFECT: BackgroundEffect = { mode: 'none' };

const warn = (err: unknown) => console.warn('the camera would not change its background', err);

/**
 * The effect running on `track`, and the way to change it. A new track gets the effect the last one had, and an effect
 * that cannot start leaves the camera with the one it had.
 */
export const useTrackBackgroundEffect = (track: LocalVideoTrack | undefined, segmentationBaseUrl: string) => {
	const [current, setCurrent] = useState<BackgroundEffect>(NO_EFFECT);
	const [applying, setApplying] = useState<BackgroundEffect>();
	const [supported, setSupported] = useState<boolean>();

	// Asked up front, so a browser that cannot run an effect is never offered one.
	useEffect(() => {
		supportsBackgroundEffects().then(setSupported, (err) => {
			warn(err);
			setSupported(false);
		});
	}, []);

	// A track this no longer drives, so an effect that lands on it after it has gone is taken off again rather than
	// left running on a stopped camera.
	const liveTrack = useRef(track);
	useLayoutEffect(() => {
		liveTrack.current = track;
		return () => {
			liveTrack.current = undefined;
		};
	}, [track]);

	const run = async (target: LocalVideoTrack, effect: BackgroundEffect) => {
		await applyBackgroundEffect(target, effect, segmentationBaseUrl);
		if (liveTrack.current !== target) {
			await target.stopProcessor().catch(warn);
		}
	};

	// Only the latest change acts and reports back: one still finishing on a camera since replaced must not touch it or
	// settle the state.
	const latest = useRef(0);

	const apply = useStableCallback(async (target: LocalVideoTrack, next: BackgroundEffect): Promise<boolean> => {
		const request = ++latest.current;
		const isLatest = () => request === latest.current;
		const previous = current;
		setApplying(next);
		try {
			await run(target, next);
			if (!isLatest()) {
				return false;
			}
			setCurrent(next);
			return true;
		} catch (err) {
			if (!isLatest()) {
				return false;
			}
			if (err instanceof UnsupportedError) {
				setSupported(false);
			} else {
				warn(err);
			}

			const tryEffect = (effect: BackgroundEffect) => run(target, effect).then(() => effect);
			const takeOff = () =>
				tryEffect(NO_EFFECT).catch((offErr) => {
					warn(offErr);
					return NO_EFFECT;
				});
			const keepPrevious = !(err instanceof UnsupportedError) && !isSameBackgroundEffect(previous, next);
			const restored = keepPrevious
				? await tryEffect(previous).catch((restoreErr) => {
						warn(restoreErr);
						return takeOff();
					})
				: await takeOff();
			if (isLatest()) {
				setCurrent(restored);
			}
			return false;
		} finally {
			if (isLatest()) {
				setApplying(undefined);
			}
		}
	});

	const onTrack = useStableCallback((next: LocalVideoTrack | undefined) => {
		latest.current++;
		setApplying(undefined);
		if (next && current.mode !== 'none') {
			void apply(next, current);
		}
	});
	useEffect(() => onTrack(track), [track, onTrack]);

	/** Whether `next` is what the camera ended up with. Without a track it is only kept, for the track that comes next. */
	const change = useStableCallback(async (next: BackgroundEffect): Promise<boolean> => {
		if (track) {
			return apply(track, next);
		}
		latest.current++;
		setApplying(undefined);
		setCurrent(next);
		return true;
	});

	return { current, applying, supported, change };
};
