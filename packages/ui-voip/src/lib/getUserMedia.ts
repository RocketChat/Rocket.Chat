export async function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
	if (navigator.mediaDevices === undefined) {
		throw new Error('Media devices not available in insecure contexts.');
	}

	return navigator.mediaDevices.getUserMedia.call(navigator.mediaDevices, constraints);
}
