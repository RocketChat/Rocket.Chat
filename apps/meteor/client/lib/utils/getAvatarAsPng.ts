import type { IUser } from '@rocket.chat/core-typings';

import { getUserAvatarURL } from '../getUserAvatarURL';

const MAX_SIZE = 128;

export const getAvatarAsPng = (username: IUser['username'], cb: (dataURL: string) => void): (() => void) => {
	const image = new Image();

	const onLoad = (): void => {
		const scale = Math.min(1, MAX_SIZE / Math.max(image.width, image.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(image.width * scale));
		canvas.height = Math.max(1, Math.round(image.height * scale));
		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error('failed to get canvas context');
		}

		context.imageSmoothingQuality = 'high';
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		try {
			return cb(canvas.toDataURL('image/png'));
		} catch (e) {
			return cb('');
		}
	};

	const onError = (): void => cb('');

	image.onload = onLoad;
	image.onerror = onError;
	image.src = getUserAvatarURL(username || '') as string;

	return onError;
};
