import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { BackgroundEffect, BackgroundEffectSelection } from '@rocket.chat/ui-conference';
import { MAX_BACKGROUND_IMAGES, isSameBackgroundEffect } from '@rocket.chat/ui-conference';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { LocalVideoTrack } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePresetBackgrounds } from './presetBackgrounds';
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

/** What is behind the reader in the camera they send, and how to change it. Uploaded images are kept for the call only. */
export const useBackgroundEffect = (cameraTrack: LocalVideoTrack | undefined, segmentationBaseUrl: string): BackgroundEffectSelection => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { current, applying, supported, change } = useTrackBackgroundEffect(cameraTrack, segmentationBaseUrl);
	const presetBackgrounds = usePresetBackgrounds();
	const presets = useMemo(() => presetBackgrounds?.map(({ url }) => url) ?? NO_URLS, [presetBackgrounds]);
	const [images, setImages] = useState<string[]>([]);

	const select = useStableCallback((next: BackgroundEffect) => {
		if (
			applying ||
			isSameBackgroundEffect(next, current) ||
			(next.mode === 'image' && !presets.includes(next.imageUrl) && !images.includes(next.imageUrl))
		) {
			return;
		}
		void change(next);
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
		await change({ mode: 'image', imageUrl });
	});

	const removeImage = useStableCallback((imageUrl: string) => {
		if (applying || !images.includes(imageUrl)) {
			return;
		}
		setImages(images.filter((image) => image !== imageUrl));
		const release = () => URL.revokeObjectURL(imageUrl);
		if (isSameBackgroundEffect(current, { mode: 'image', imageUrl })) {
			// Let go only once the camera has stopped reading it.
			void change(NO_EFFECT).finally(release);
			return;
		}
		release();
	});

	const releaseImages = useStableCallback(() => images.forEach((imageUrl) => URL.revokeObjectURL(imageUrl)));
	useEffect(() => releaseImages, [releaseImages]);

	const cameraSource = cameraTrack?.mediaStream;

	return useMemo(
		() => ({ current, applying, presets, images, supported, cameraSource, select, uploadImage, removeImage }),
		[current, applying, presets, images, supported, cameraSource, select, uploadImage, removeImage],
	);
};
