import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { BackgroundEffect, BackgroundEffectSelection } from '@rocket.chat/ui-conference';
import { MAX_BACKGROUND_IMAGES, isSameBackgroundEffect, useBackgroundPreference } from '@rocket.chat/ui-conference';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { LocalVideoTrack, Room } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { createBackgroundProcessor, failClosed, refuseCamera, setCaptureProcessor } from './backgroundProcessor';
import { effectFor, preferenceFor, usePresetBackgrounds } from './presetBackgrounds';
import { useTrackBackgroundEffect } from './useTrackBackgroundEffect';

/** Larger than any frame a camera sends, so a smaller copy loses nothing the others would see. */
const MAX_IMAGE_SIDE = 1920;

const NO_EFFECT: BackgroundEffect = { mode: 'none' };

const NO_URLS: string[] = [];

/** The picture in `file`, no larger than the camera needs it, or nothing when the browser cannot read it. */
const readImage = async (file: File): Promise<Blob | undefined> => {
	const bitmap = await createImageBitmap(file).catch(() => undefined);
	if (!bitmap) {
		return undefined;
	}
	try {
		const scale = MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height);
		if (scale >= 1) {
			return file;
		}
		const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
		const context = canvas.getContext('2d');
		if (!context) {
			return undefined;
		}
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
	} catch {
		return undefined;
	} finally {
		bitmap.close();
	}
};

/**
 * What is behind the reader in the camera they send, and how to change it, starting from what they chose before
 * joining. Uploaded images are kept for the call only.
 *
 * `ready` holds the call back until a camera opened on arrival would already carry the effect, so no frame of the room
 * behind the reader is ever sent; once the call has started it stays true.
 */
export const useBackgroundEffect = (
	room: Room,
	cameraTrack: LocalVideoTrack | undefined,
	segmentationBaseUrl: string,
	arriving: boolean,
): { selection: BackgroundEffectSelection; ready: boolean } => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { current, applying, supported, change } = useTrackBackgroundEffect(cameraTrack, segmentationBaseUrl);
	const { background: remembered, selectBackground } = useBackgroundPreference();
	const presetBackgrounds = usePresetBackgrounds();
	const presets = useMemo(() => presetBackgrounds?.map(({ url }) => url) ?? NO_URLS, [presetBackgrounds]);
	const [images, setImages] = useState<string[]>([]);

	// What the reader chose before joining, taken as they join; a choice in the call from then on is the call's.
	const [started, setStarted] = useState(false);
	useEffect(() => {
		if (!arriving || started) {
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
	}, [current, arriving, started, remembered, presetBackgrounds, change]);

	const onArrivalFailed = useStableCallback((err: unknown) => {
		console.warn('the camera would not change its background', err);
		void change(NO_EFFECT);
		return new Error(t('Camera_background_failed_camera_off'));
	});

	// The room is given a fresh processor for each camera, since the last one went to the camera that took it.
	const [prepared, setPrepared] = useState<BackgroundEffect>();
	const preparing = useRef(0);
	const prepare = useStableCallback(async (effect: BackgroundEffect) => {
		const request = ++preparing.current;
		const processor =
			effect.mode === 'none'
				? undefined
				: await createBackgroundProcessor(effect, segmentationBaseUrl).then(
						(made) => failClosed(made, onArrivalFailed),
						(err: unknown) => refuseCamera(err, onArrivalFailed),
					);
		if (request !== preparing.current) {
			return;
		}
		setCaptureProcessor(room, processor);
		setPrepared(effect);
	});
	useEffect(() => {
		if (started) {
			void prepare(current);
		}
	}, [started, current, cameraTrack, prepare]);

	const [ready, setReady] = useState(false);
	if (!ready && started && prepared && isSameBackgroundEffect(prepared, current)) {
		setReady(true);
	}

	/** Remembered once it is on the camera, so the next call starts from what this one ended up with. */
	const changeAndRemember = useStableCallback(async (next: BackgroundEffect) => {
		if (await change(next)) {
			selectBackground(preferenceFor(next, presetBackgrounds));
		}
	});

	const select = useStableCallback((next: BackgroundEffect) => {
		if (
			applying ||
			isSameBackgroundEffect(next, current) ||
			(next.mode === 'image' && !presets.includes(next.imageUrl) && !images.includes(next.imageUrl))
		) {
			return;
		}
		void changeAndRemember(next);
	});

	const reading = useRef(false);

	const uploadImage = useStableCallback(async (file: File) => {
		if (applying || reading.current || images.length >= MAX_BACKGROUND_IMAGES) {
			return;
		}
		reading.current = true;
		const image = await readImage(file).finally(() => {
			reading.current = false;
		});
		if (!image) {
			dispatchToastMessage({ type: 'error', message: t('Camera_background_image_unreadable') });
			return;
		}
		const imageUrl = URL.createObjectURL(image);
		setImages((uploaded) => [...uploaded, imageUrl]);
		await changeAndRemember({ mode: 'image', imageUrl });
	});

	const removeImage = useStableCallback((imageUrl: string) => {
		if (applying || !images.includes(imageUrl)) {
			return;
		}
		setImages(images.filter((image) => image !== imageUrl));
		const release = () => URL.revokeObjectURL(imageUrl);
		if (isSameBackgroundEffect(current, { mode: 'image', imageUrl })) {
			// Let go only once the camera has stopped reading it.
			void changeAndRemember(NO_EFFECT).finally(release);
			return;
		}
		release();
	});

	const releaseImages = useStableCallback(() => images.forEach((imageUrl) => URL.revokeObjectURL(imageUrl)));
	useEffect(() => releaseImages, [releaseImages]);

	const cameraSource = cameraTrack?.mediaStream;

	const selection = useMemo(
		() => ({ current, applying, presets, images, supported, cameraSource, select, uploadImage, removeImage }),
		[current, applying, presets, images, supported, cameraSource, select, uploadImage, removeImage],
	);

	return { selection, ready };
};
