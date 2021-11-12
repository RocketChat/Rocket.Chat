import { before, after } from 'mocha';

export const withBlobUrls = (): void => {
	let createObjectURL: typeof URL.createObjectURL;
	let revokeObjectURL: typeof URL.revokeObjectURL;

	before(() => {
		const blobs = new Map<string, Blob>();

		createObjectURL = window.URL.createObjectURL;
		revokeObjectURL = window.URL.revokeObjectURL;

		window.URL.createObjectURL = (blob: Blob): string => {
			const uuid = Math.random().toString(36).slice(2);
			const url = `blob://${ uuid }`;
			blobs.set(url, blob);
			return url;
		};

		window.URL.revokeObjectURL = (url: string): void => {
			blobs.delete(url);
		};
	});

	after(() => {
		window.URL.createObjectURL = createObjectURL;
		window.URL.revokeObjectURL = revokeObjectURL;
	});
};
