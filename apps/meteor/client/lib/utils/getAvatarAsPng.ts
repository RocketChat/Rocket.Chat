import type { IUser } from '@rocket.chat/core-typings';

import { getUserAvatarURL } from '../../../app/utils/lib/getUserAvatarURL';

export const getAvatarAsPng = (username: IUser['username'], cb: (dataURL: string) => void): (() => void) => {
	const image = new Image();

	const onLoad = (): void => {
		const canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error('failed to get canvas context');
		}

		context.drawImage(image, 0, 0);
		try {
			return cb(canvas.toDataURL('image/png'));
		} catch (e) {
			return cb('');
		}
	};

	const onError = (): void => cb('');

	image.onload = onLoad;
	image.onerror = onError;
	image.src = getUserAvatarURL(username);

	return onError;
};
