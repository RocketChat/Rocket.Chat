export const getUserMedia = async () => {
	const oldGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	if (navigator.mediaDevices) {
		return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
	}
	if (oldGetUserMedia) {
		return new Promise((resolve, handle) => oldGetUserMedia.call(navigator, { audio: true, video: true }, resolve, handle));
	}

	throw new Error('getUserMedia not supported');
};
