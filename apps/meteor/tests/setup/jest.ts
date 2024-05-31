import * as uuid from 'uuid';
import '@testing-library/jest-dom';

const urlByBlob = new WeakMap<Blob, string>();
const blobByUrl = new Map<string, Blob>();

globalThis.URL.createObjectURL = (blob: Blob): string => {
	const url = urlByBlob.get(blob) ?? `blob://${uuid.v4()}`;
	urlByBlob.set(blob, url);
	blobByUrl.set(url, blob);
	return url;
};

globalThis.URL.revokeObjectURL = (url: string): void => {
	const blob = blobByUrl.get(url);
	if (!blob) {
		return;
	}

	urlByBlob.delete(blob);
	blobByUrl.delete(url);
};

globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));
