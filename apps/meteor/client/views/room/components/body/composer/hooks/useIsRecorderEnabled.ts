import { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';

export const getUserMedia: typeof navigator.mediaDevices.getUserMedia = async () => {
	const oldGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	if (navigator.mediaDevices) {
		return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
	}
	if (oldGetUserMedia) {
		return new Promise((resolve, handle) => oldGetUserMedia.call(navigator, { audio: true, video: true }, resolve, handle));
	}

	throw new Error('getUserMedia not supported');
};

export type VideoMessageRecorderProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
};

type RecordingState = {
	isAllowed: boolean;
	isNotSupported: boolean;
};

export const useIsRecorderEnabled = (extension: RegExp): RecordingState => {
	const fileUploadEnabled = Boolean(useSetting('FileUpload_Enabled'));

	const mediaTypeBlackList = String(useSetting('FileUpload_MediaTypeBlackList'));
	const mediaTypeWhiteList = String(useSetting('FileUpload_MediaTypeWhiteList'));

	const isAllowed =
		fileUploadEnabled &&
		(!mediaTypeBlackList || !mediaTypeBlackList.match(extension)) &&
		(!mediaTypeWhiteList || Boolean(mediaTypeWhiteList.match(extension)));

	const isNotSupported = !navigator.mediaDevices;

	return {
		isAllowed,
		isNotSupported,
	};
};
