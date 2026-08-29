import { useSyncExternalStore } from 'react';

export type VirtualBackgroundSnapshot = {
	active: boolean;
	image?: ImageBitmap;
	name?: string;
};

const MAX_BACKGROUND_DIMENSION = 2560;
const EMPTY_SNAPSHOT: VirtualBackgroundSnapshot = { active: false };

let snapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

const publish = (next: VirtualBackgroundSnapshot): void => {
	const previous = snapshot.image;
	snapshot = next;
	listeners.forEach((listener) => listener());

	// Renderers upload synchronously when React applies the new snapshot. Keep the old bitmap alive through that turn
	// so a processor which is still initializing cannot observe a closed image.
	if (previous && previous !== next.image) {
		setTimeout(() => previous.close(), 1000);
	}
};

const decodeImage = async (file: File): Promise<ImageBitmap> => {
	if (!file.type.startsWith('image/')) {
		throw new Error('the selected virtual background is not an image');
	}

	// WebGL intentionally ignores UNPACK_FLIP_Y_WEBGL for ImageBitmap sources. Decode in texture orientation once so
	// the replacement is upright without paying for a shader branch on every output pixel.
	const decoded = await createImageBitmap(file, { imageOrientation: 'flipY' });
	const largestDimension = Math.max(decoded.width, decoded.height);
	if (largestDimension <= MAX_BACKGROUND_DIMENSION) {
		return decoded;
	}

	const scale = MAX_BACKGROUND_DIMENSION / largestDimension;
	const resized = await createImageBitmap(decoded, {
		resizeWidth: Math.max(1, Math.round(decoded.width * scale)),
		resizeHeight: Math.max(1, Math.round(decoded.height * scale)),
		resizeQuality: 'high',
	});
	decoded.close();
	return resized;
};

/** Decode and activate a local image. Its bytes never leave the browser or enter call preferences. */
export const selectVirtualBackground = async (file: File): Promise<void> => {
	const image = await decodeImage(file);
	publish({ active: true, image, name: file.name });
};

/** Reuse the already-decoded image after temporarily choosing blur or no effect. */
export const activateVirtualBackground = (): void => {
	if (snapshot.image && !snapshot.active) {
		publish({ ...snapshot, active: true });
	}
};

/** Stop replacing the background while retaining the decoded image for a later selection. */
export const deactivateVirtualBackground = (): void => {
	if (snapshot.active) {
		publish({ ...snapshot, active: false });
	}
};

/** Exposed for diagnostics and deterministic store tests; React consumers should use the hook below. */
export const getVirtualBackgroundSnapshot = (): VirtualBackgroundSnapshot => snapshot;

const subscribe = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

export const useVirtualBackground = (): VirtualBackgroundSnapshot =>
	useSyncExternalStore(
		subscribe,
		() => snapshot,
		() => EMPTY_SNAPSHOT,
	);
