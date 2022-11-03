import { v4 } from 'uuid';

export const enableBlobUrlsMock = (): void => {
	const urlByBlob = new WeakMap<Blob, string>();
	const blobByUrl = new Map<string, Blob>();

	window.URL.createObjectURL = (blob: Blob): string => {
		const url = urlByBlob.get(blob) ?? `blob://${v4()}`;
		urlByBlob.set(blob, url);
		blobByUrl.set(url, blob);
		return url;
	};

	window.URL.revokeObjectURL = (url: string): void => {
		const blob = blobByUrl.get(url);
		if (!blob) {
			return;
		}

		urlByBlob.delete(blob);
		blobByUrl.delete(url);
	};
};
