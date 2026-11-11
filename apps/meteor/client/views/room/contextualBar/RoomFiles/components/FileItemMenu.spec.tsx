import type { IUpload } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../../../../lib/download', () => ({
	download: jest.fn(),
	downloadAs: jest.fn(),
}));

jest.mock('../../../../../lib/getURL', () => ({
	getURL: jest.fn((url: string) => url),
}));

jest.mock('../hooks/useMessageDeletionIsAllowed', () => ({
	useMessageDeletionIsAllowed: jest.fn(() => false),
}));

const readBlobAsArrayBuffer = (blob: Blob): Promise<ArrayBuffer> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as ArrayBuffer);
		reader.onerror = () => reject(reader.error);
		reader.readAsArrayBuffer(blob);
	});

describe('FileItemMenu', () => {
	let FileItemMenu: typeof import('./FileItemMenu').default;
	let downloadAs: jest.Mock;
	let messageHandler: ((event: MessageEvent) => void) | undefined;
	const postMessageMock = jest.fn();

	beforeAll(async () => {
		(navigator.serviceWorker as any).controller = {
			postMessage: postMessageMock,
		};
		jest.spyOn(navigator.serviceWorker, 'addEventListener').mockImplementation((event: string, handler: any) => {
			if (event === 'message') {
				messageHandler = handler;
			}
		});

		const downloadModule = await import('../../../../../lib/download');
		downloadAs = downloadModule.downloadAs as jest.Mock;
		const fileItemMenuModule = await import('./FileItemMenu');
		FileItemMenu = fileItemMenuModule.default;
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const fakeEncryptedFile: IUpload = {
		_id: 'file-encrypted-123',
		name: 'encrypted-document.pdf',
		path: '/file-decrypt/files/room-1/encrypted-document.pdf',
		encryption: {
			algorithm: 'AES-CBC',
			key: 'fake-key',
			iv: 'fake-iv',
		} as any,
	} as IUpload;

	const renderMenu = (fileData: IUpload = fakeEncryptedFile) =>
		render(<FileItemMenu rid='room-123' fileData={fileData} onClickDelete={jest.fn()} />, {
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Download: 'Download',
					More_actions: 'More actions',
					Options: 'Options',
				})
				.build(),
		});

	it('should support sequential clicks and trigger download for each click', async () => {
		renderMenu();

		await userEvent.click(screen.getByRole('button', { name: /more/i }));
		await userEvent.click(await screen.findByText('Download'));

		expect(postMessageMock).toHaveBeenCalledTimes(1);
		const firstCall = postMessageMock.mock.calls[0][0];
		expect(firstCall).toEqual({
			type: 'attachment-download',
			url: fakeEncryptedFile.path,
			id: expect.any(String),
		});

		const firstBuffer = new ArrayBuffer(8);
		act(() => {
			messageHandler?.({
				data: {
					type: 'attachment-download-result',
					id: firstCall.id,
					result: firstBuffer,
				},
			} as MessageEvent);
		});

		expect(downloadAs).toHaveBeenCalledTimes(1);
		expect(downloadAs).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.any(Array) }), 'encrypted-document.pdf');

		await userEvent.click(screen.getByRole('button', { name: /more/i }));
		await userEvent.click(await screen.findByText('Download'));

		expect(postMessageMock).toHaveBeenCalledTimes(2);
		const secondCall = postMessageMock.mock.calls[1][0];
		expect(secondCall).toEqual({
			type: 'attachment-download',
			url: fakeEncryptedFile.path,
			id: expect.any(String),
		});
		expect(secondCall.id).not.toBe(firstCall.id);

		const secondBuffer = new ArrayBuffer(8);
		act(() => {
			messageHandler?.({
				data: {
					type: 'attachment-download-result',
					id: secondCall.id,
					result: secondBuffer,
				},
			} as MessageEvent);
		});

		expect(downloadAs).toHaveBeenCalledTimes(2);
		expect(downloadAs).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.any(Array) }), 'encrypted-document.pdf');
	});

	it('should generate unique transactionIds on rapid clicks', async () => {
		renderMenu();

		await userEvent.click(screen.getByRole('button', { name: /more/i }));
		await userEvent.click(await screen.findByText('Download'));

		await userEvent.click(screen.getByRole('button', { name: /more/i }));
		await userEvent.click(await screen.findByText('Download'));

		await userEvent.click(screen.getByRole('button', { name: /more/i }));
		await userEvent.click(await screen.findByText('Download'));

		expect(postMessageMock).toHaveBeenCalledTimes(3);

		const id1 = postMessageMock.mock.calls[0][0].id;
		const id2 = postMessageMock.mock.calls[1][0].id;
		const id3 = postMessageMock.mock.calls[2][0].id;

		expect(typeof id1).toBe('string');
		expect(typeof id2).toBe('string');
		expect(typeof id3).toBe('string');

		const uniqueIds = new Set([id1, id2, id3]);
		expect(uniqueIds.size).toBe(3);

		const buffer1 = new ArrayBuffer(8);
		const buffer2 = new ArrayBuffer(8);
		const buffer3 = new ArrayBuffer(8);

		act(() => {
			messageHandler?.({
				data: {
					type: 'attachment-download-result',
					id: id1,
					result: buffer1,
				},
			} as MessageEvent);
		});
		expect(downloadAs).toHaveBeenCalledTimes(1);

		act(() => {
			messageHandler?.({
				data: {
					type: 'attachment-download-result',
					id: id2,
					result: buffer2,
				},
			} as MessageEvent);
		});
		expect(downloadAs).toHaveBeenCalledTimes(2);

		act(() => {
			messageHandler?.({
				data: {
					type: 'attachment-download-result',
					id: id3,
					result: buffer3,
				},
			} as MessageEvent);
		});
		expect(downloadAs).toHaveBeenCalledTimes(3);
	});

	it('should handle out-of-order responses correctly', async () => {
		renderMenu();

		await userEvent.click(screen.getByRole('button', { name: /more/i }));
		await userEvent.click(await screen.findByText('Download'));
		const id1 = postMessageMock.mock.calls[0][0].id;

		await userEvent.click(screen.getByRole('button', { name: /more/i }));
		await userEvent.click(await screen.findByText('Download'));
		const id2 = postMessageMock.mock.calls[1][0].id;

		const payload1 = Uint8Array.from([11, 22, 33]).buffer;
		const payload2 = Uint8Array.from([44, 55, 66, 77]).buffer;

		act(() => {
			messageHandler?.({
				data: {
					type: 'attachment-download-result',
					id: id2,
					result: payload2,
				},
			} as MessageEvent);
		});

		expect(downloadAs).toHaveBeenCalledTimes(1);

		act(() => {
			messageHandler?.({
				data: {
					type: 'attachment-download-result',
					id: id1,
					result: payload1,
				},
			} as MessageEvent);
		});

		expect(downloadAs).toHaveBeenCalledTimes(2);

		const firstCallBlob = downloadAs.mock.calls[0][0].data[0] as Blob;
		const secondCallBlob = downloadAs.mock.calls[1][0].data[0] as Blob;

		expect(firstCallBlob.size).toBe(payload2.byteLength);
		expect(secondCallBlob.size).toBe(payload1.byteLength);

		const firstCallBytes = new Uint8Array(await readBlobAsArrayBuffer(firstCallBlob));
		const secondCallBytes = new Uint8Array(await readBlobAsArrayBuffer(secondCallBlob));

		expect(firstCallBytes).toEqual(new Uint8Array(payload2));
		expect(secondCallBytes).toEqual(new Uint8Array(payload1));
	});

	it('should clean up listener after timeout if no response is received', async () => {
		jest.useFakeTimers();
		renderMenu();

		await userEvent.click(screen.getByRole('button', { name: /more/i }), {
			advanceTimers: jest.advanceTimersByTime,
		});
		await userEvent.click(await screen.findByText('Download'), {
			advanceTimers: jest.advanceTimersByTime,
		});

		expect(postMessageMock).toHaveBeenCalledTimes(1);
		const { id } = postMessageMock.mock.calls[0][0];

		act(() => {
			jest.advanceTimersByTime(30000);
		});

		const buffer = new ArrayBuffer(8);
		act(() => {
			messageHandler?.({
				data: {
					type: 'attachment-download-result',
					id,
					result: buffer,
				},
			} as MessageEvent);
		});

		expect(downloadAs).not.toHaveBeenCalled();
	});
});
