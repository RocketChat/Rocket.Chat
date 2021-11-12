import 'jsdom-global/register';

const blobs = new Map<string, Blob>();

window.URL.createObjectURL = (blob: Blob): string => {
	const uuid = Math.random().toString(36).slice(2);
	const url = `blob://${ uuid }`;
	blobs.set(url, blob);
	return url;
};

window.URL.revokeObjectURL = (url: string): void => {
	blobs.delete(url);
};
