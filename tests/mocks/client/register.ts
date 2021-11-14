import globalJsdom from 'jsdom-global';
import uuid from 'uuid';

globalJsdom(
	'<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>',
	{
		url: 'http://localhost:3000',
	},
);

const urlByBlob = new WeakMap<Blob, string>();
const blobByUrl = new Map<string, Blob>();

window.URL.createObjectURL = (blob: Blob): string => {
	const url = urlByBlob.get(blob) ?? `blob://${ uuid.v4() }`;
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
