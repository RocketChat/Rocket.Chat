import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useOpenEncryptedPdf } from './useOpenEncryptedPdf';
import { forAttachmentDownload, registerDownloadForUid } from '../../hooks/useDownloadFromServiceWorker';

jest.mock('../../hooks/useDownloadFromServiceWorker', () => ({
	forAttachmentDownload: jest.fn(),
	registerDownloadForUid: jest.fn(),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useMediaUrl: () => (url: string) => url,
}));

const mockForAttachmentDownload = forAttachmentDownload as jest.MockedFunction<typeof forAttachmentDownload>;
const mockRegisterDownloadForUid = registerDownloadForUid as jest.MockedFunction<typeof registerDownloadForUid>;

const mockAbort = jest.fn();
const mockAbortController = jest.fn(() => {
	const signal = { aborted: false };
	return {
		abort: jest.fn(() => {
			mockAbort();
			signal.aborted = true;
		}),
		signal,
	};
});

describe('useOpenEncryptedPdf', () => {
	const testBlob = new Blob(['content'], { type: 'application/pdf' });
	const title = 'My PDF';
	const link = '/file-decrypt/encrypted-pdf.pdf';
	const format = 'PDF';
	const allowedSize = 5 * 1024 * 1024;

	let mockOpenDocumentViewer: jest.Mock;
	let mockFetch: jest.Mock;
	let mockRevokeObjectURL: jest.Mock;
	let mockCreateObjectURL: jest.Mock;

	const originalFetch = global.fetch;
	const originalCreateObjectURL = global.URL.createObjectURL;
	const originalRevokeObjectURL = global.URL.revokeObjectURL;
	const originalAbortController = global.AbortController;

	beforeEach(() => {
		jest.clearAllMocks();

		window.RocketChatDesktop = {
			getE2ePdfPreviewSizeLimit: jest.fn(() => 15),
		} as any;

		mockOpenDocumentViewer = jest.fn();

		// Mock fetch
		mockFetch = jest.fn();
		global.fetch = mockFetch;

		// Mock URL methods
		mockCreateObjectURL = jest.fn(() => `blob:mock-url-${Math.random()}`);
		mockRevokeObjectURL = jest.fn();
		global.URL.createObjectURL = mockCreateObjectURL;
		global.URL.revokeObjectURL = mockRevokeObjectURL;

		// Mock AbortController
		global.AbortController = mockAbortController as any;
	});

	afterEach(() => {
		jest.restoreAllMocks();
		global.fetch = originalFetch;
		global.URL.createObjectURL = originalCreateObjectURL;
		global.URL.revokeObjectURL = originalRevokeObjectURL;
		global.AbortController = originalAbortController;
		delete (window as any).RocketChatDesktop;
	});

	describe('file size is not within the limit', () => {
		it('should download file if it exceeds the preview size limit', async () => {
			const { result } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			const exceededSize = 20 * 1024 * 1024; // 20 MB (exceeds 15 MB limit)

			await act(async () => {
				await result.current(link, title, exceededSize, format, mockOpenDocumentViewer);
			});

			expect(mockRegisterDownloadForUid).toHaveBeenCalled();
			expect(mockForAttachmentDownload).toHaveBeenCalledWith(expect.any(String), link);
			expect(mockOpenDocumentViewer).not.toHaveBeenCalled();
		});

		it('should download file if size is undefined', async () => {
			const { result } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			await act(async () => {
				await result.current(link, title, undefined, format, mockOpenDocumentViewer);
			});

			expect(mockRegisterDownloadForUid).toHaveBeenCalled();
			expect(mockForAttachmentDownload).toHaveBeenCalledWith(expect.any(String), link);
			expect(mockOpenDocumentViewer).not.toHaveBeenCalled();
		});
	});

	describe('files that are downloaded', () => {
		it('should register and request each download under its own id (message-attachments R18)', async () => {
			const { result } = renderHook(() => useOpenEncryptedPdf(), { wrapper: mockAppRoot().build() });
			const tooLarge = 20 * 1024 * 1024;

			await act(async () => {
				await result.current('/file-decrypt/a.pdf', 'A', tooLarge, format, mockOpenDocumentViewer);
				await result.current('/file-decrypt/b.pdf', 'B', tooLarge, format, mockOpenDocumentViewer);
			});

			const [[firstId, , firstTitle], [secondId, , secondTitle]] = mockRegisterDownloadForUid.mock.calls;
			expect(firstId).not.toBe(secondId);
			expect([firstTitle, secondTitle]).toEqual(['A', 'B']);
			expect(mockForAttachmentDownload.mock.calls.map(([id, link]) => [id, link])).toEqual([
				[firstId, '/file-decrypt/a.pdf'],
				[secondId, '/file-decrypt/b.pdf'],
			]);
		});
	});

	describe('file size is within the limit', () => {
		it('should fetch and open PDF', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				blob: jest.fn().mockResolvedValueOnce(testBlob),
			});

			const { result } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			await act(async () => {
				await result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
			});

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith(link, expect.objectContaining({ signal: expect.any(Object) }));
				expect(mockCreateObjectURL).toHaveBeenCalledWith(testBlob);
				expect(mockOpenDocumentViewer).toHaveBeenCalledWith(expect.stringContaining('blob:'), format, title);
			});
		});

		it('should open the PDF viewer if title is undefined, falling back to empty string', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				blob: jest.fn().mockResolvedValueOnce(testBlob),
			});

			const { result } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			await act(async () => {
				await result.current(link, undefined, allowedSize, format, mockOpenDocumentViewer);
			});

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith(link, expect.objectContaining({ signal: expect.any(Object) }));
				expect(mockCreateObjectURL).toHaveBeenCalledWith(testBlob);
				expect(mockOpenDocumentViewer).toHaveBeenCalledWith(expect.stringContaining('blob:'), format, '');
			});
		});
	});

	describe('when the desktop size limit call throws', () => {
		beforeEach(() => {
			window.RocketChatDesktop = {
				getE2ePdfPreviewSizeLimit: jest.fn(() => {
					throw new Error('desktop failure');
				}),
			} as any;
			jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		});

		it('should fall back to 10MB limit and download if file exceeds it', async () => {
			const { result } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			const exceededSize = 11 * 1024 * 1024; // 11 MB

			await act(async () => {
				await result.current(link, title, exceededSize, format, mockOpenDocumentViewer);
			});

			expect(mockForAttachmentDownload).toHaveBeenCalledWith(expect.any(String), link);
			expect(mockOpenDocumentViewer).not.toHaveBeenCalled();
		});
	});

	describe('when RocketChatDesktop is undefined', () => {
		beforeEach(() => {
			delete (window as any).RocketChatDesktop;
		});

		it('should fall back to 10MB limit and download if file exceeds it', async () => {
			const { result } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			const exceededSize = 11 * 1024 * 1024; // 11 MB

			await act(async () => {
				await result.current(link, title, exceededSize, format, mockOpenDocumentViewer);
			});

			expect(mockRegisterDownloadForUid).toHaveBeenCalled();
			expect(mockForAttachmentDownload).toHaveBeenCalledWith(expect.any(String), link);
			expect(mockOpenDocumentViewer).not.toHaveBeenCalled();
		});

		it('should fall back to 10MB limit and open PDF if size is within limit', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				blob: jest.fn().mockResolvedValueOnce(testBlob),
			});

			const { result } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			await act(async () => {
				await result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
			});

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith(link, expect.objectContaining({ signal: expect.any(Object) }));
				expect(mockCreateObjectURL).toHaveBeenCalledWith(testBlob);
				expect(mockOpenDocumentViewer).toHaveBeenCalledWith(expect.stringContaining('blob:'), format, title);
			});
		});
	});

	describe('blob URL management', () => {
		it('should revoke previous blob URL before creating a new one', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					blob: jest.fn().mockResolvedValueOnce(testBlob),
				})
				.mockResolvedValueOnce({
					ok: true,
					blob: jest.fn().mockResolvedValueOnce(testBlob),
				});

			const { result } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			// First call
			await act(async () => {
				await result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
			});

			await waitFor(() => {
				expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
			});

			// Second call
			await act(async () => {
				await result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
			});

			await waitFor(() => {
				expect(mockRevokeObjectURL).toHaveBeenCalled();
				expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
			});
		});

		it('should keep the blob URL of a file while another file is opened (message-attachments R18)', async () => {
			mockFetch.mockResolvedValue({ ok: true, blob: jest.fn().mockResolvedValue(testBlob) });
			mockCreateObjectURL.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');

			const { result } = renderHook(() => useOpenEncryptedPdf(), { wrapper: mockAppRoot().build() });

			await act(async () => {
				await result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
				await result.current('/file-decrypt/other.pdf', 'Other', allowedSize, format, mockOpenDocumentViewer);
			});

			expect(mockOpenDocumentViewer).toHaveBeenCalledWith('blob:first', format, title);
			expect(mockOpenDocumentViewer).toHaveBeenCalledWith('blob:second', format, 'Other');
			expect(mockRevokeObjectURL).not.toHaveBeenCalled();
		});

		it('should revoke every blob URL on unmount (message-attachments R18)', async () => {
			mockFetch.mockResolvedValue({ ok: true, blob: jest.fn().mockResolvedValue(testBlob) });
			mockCreateObjectURL.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');

			const { result, unmount } = renderHook(() => useOpenEncryptedPdf(), { wrapper: mockAppRoot().build() });

			await act(async () => {
				await result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
				await result.current('/file-decrypt/other.pdf', 'Other', allowedSize, format, mockOpenDocumentViewer);
			});
			unmount();

			expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:first');
			expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:second');
		});

		it('should keep the blobs of the five most recently opened files only (message-attachments R18)', async () => {
			mockFetch.mockResolvedValue({ ok: true, blob: jest.fn().mockResolvedValue(testBlob) });
			let created = 0;
			mockCreateObjectURL.mockImplementation(() => `blob:${++created}`);

			const { result } = renderHook(() => useOpenEncryptedPdf(), { wrapper: mockAppRoot().build() });

			await act(async () => {
				// Seven files: the five opened last keep their blobs, the first two are released.
				for (let index = 1; index <= 7; index++) {
					await result.current(`/file-decrypt/${index}.pdf`, `File ${index}`, allowedSize, format, mockOpenDocumentViewer);
				}
			});

			expect(mockRevokeObjectURL.mock.calls.map(([url]) => url)).toEqual(['blob:1', 'blob:2']);
		});

		it('should count an opened file again as the most recent one (message-attachments R18)', async () => {
			mockFetch.mockResolvedValue({ ok: true, blob: jest.fn().mockResolvedValue(testBlob) });
			let created = 0;
			mockCreateObjectURL.mockImplementation(() => `blob:${++created}`);

			const { result } = renderHook(() => useOpenEncryptedPdf(), { wrapper: mockAppRoot().build() });

			await act(async () => {
				for (let index = 1; index <= 5; index++) {
					await result.current(`/file-decrypt/${index}.pdf`, `File ${index}`, allowedSize, format, mockOpenDocumentViewer);
				}
				await result.current('/file-decrypt/1.pdf', 'File 1', allowedSize, format, mockOpenDocumentViewer);
				await result.current('/file-decrypt/new.pdf', 'New', allowedSize, format, mockOpenDocumentViewer);
			});

			expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:2');
			expect(mockRevokeObjectURL).not.toHaveBeenCalledWith('blob:6');
		});

		it('should not keep a finished request to abort it later (message-attachments R18)', async () => {
			mockFetch.mockResolvedValue({ ok: true, blob: jest.fn().mockResolvedValue(testBlob) });
			const { result, unmount } = renderHook(() => useOpenEncryptedPdf(), { wrapper: mockAppRoot().build() });

			await act(async () => {
				await result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
			});
			unmount();

			expect(mockAbort).not.toHaveBeenCalled();
		});

		it('should revoke blob URL on component unmount', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				blob: jest.fn().mockResolvedValueOnce(testBlob),
			});

			const { result, unmount } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			await act(async () => {
				await result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
			});

			await waitFor(() => {
				expect(mockCreateObjectURL).toHaveBeenCalled();
			});

			unmount();

			expect(mockRevokeObjectURL).toHaveBeenCalled();
		});
	});

	describe('fetch failure handling', () => {
		let consoleErrorSpy: jest.SpyInstance;

		beforeEach(() => {
			consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		});

		afterEach(() => {
			consoleErrorSpy.mockRestore();
		});

		it('should throw error if fetch response is not ok', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

			const { result } = renderHook(() => useOpenEncryptedPdf(), {
				wrapper: mockAppRoot().build(),
			});

			await expect(async () => {
				await result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
			}).rejects.toThrow('Failed to fetch encrypted PDF: 404');

			await waitFor(() => {
				expect(consoleErrorSpy).toHaveBeenCalledWith(
					'Error opening preview of encrypted PDF',
					expect.objectContaining({ message: expect.stringContaining('Failed to fetch encrypted PDF: 404') }),
				);
			});
		});
	});

	describe('concurrent requests', () => {
		it('should ignore blob from cancelled request', async () => {
			let resolveFirstFetch: any;

			mockFetch
				.mockImplementationOnce(() => {
					return new Promise((resolve) => {
						resolveFirstFetch = resolve;
					});
				})
				.mockImplementationOnce(() => {
					return Promise.resolve({ ok: true, blob: jest.fn().mockResolvedValueOnce(testBlob) });
				});

			const { result } = renderHook(() => useOpenEncryptedPdf(), { wrapper: mockAppRoot().build() });

			const promise1 = result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
			const promise2 = result.current(link, title, allowedSize, format, mockOpenDocumentViewer);

			await act(async () => {
				resolveFirstFetch({ ok: true, blob: jest.fn().mockResolvedValue(testBlob) });
				await Promise.all([promise1, promise2]);
			});

			expect(mockOpenDocumentViewer).toHaveBeenCalledTimes(1);
			expect(mockAbort).toHaveBeenCalledTimes(1);
		});
	});
});
