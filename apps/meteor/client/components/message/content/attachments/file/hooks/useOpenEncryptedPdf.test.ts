import { afterEach, beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, act, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock, MockInstance, MockedFunction } from 'jest-mock';
import proxyquire from 'proxyquire';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const spyOn: ModuleMocker['spyOn'] = mocker.spyOn.bind(mocker);
const useDownloadFromServiceWorkerMock = {
	forAttachmentDownload: fn<FunctionLike>(),
	registerDownloadForUid: fn<FunctionLike>(),
};

const { forAttachmentDownload, registerDownloadForUid } =
	useDownloadFromServiceWorkerMock as unknown as typeof import('../../../../../../hooks/useDownloadFromServiceWorker');

const { useOpenEncryptedPdf } = proxyquire.noCallThru().load<typeof import('./useOpenEncryptedPdf')>('./useOpenEncryptedPdf', {
	'@rocket.chat/ui-contexts': {
		...require('@rocket.chat/ui-contexts'),
		useMediaUrl: () => (url: string) => url,
	},
	'../../../../../../hooks/useDownloadFromServiceWorker': useDownloadFromServiceWorkerMock,
});

const mockForAttachmentDownload = forAttachmentDownload as MockedFunction<typeof forAttachmentDownload>;
const mockRegisterDownloadForUid = registerDownloadForUid as MockedFunction<typeof registerDownloadForUid>;

const mockAbort = fn<FunctionLike>();
const mockAbortController = fn<FunctionLike>(() => {
	const signal = { aborted: false };
	return {
		abort: fn<FunctionLike>(() => {
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

	let mockOpenDocumentViewer: Mock<FunctionLike>;
	let mockFetch: Mock<FunctionLike>;
	let mockRevokeObjectURL: Mock<FunctionLike>;
	let mockCreateObjectURL: Mock<FunctionLike>;

	const originalFetch = global.fetch;
	const originalCreateObjectURL = global.URL.createObjectURL;
	const originalRevokeObjectURL = global.URL.revokeObjectURL;
	const originalAbortController = global.AbortController;

	beforeEach(() => {
		mocker.clearAllMocks();

		window.RocketChatDesktop = {
			getE2ePdfPreviewSizeLimit: fn<FunctionLike>(() => 15),
		} as any;

		mockOpenDocumentViewer = fn<FunctionLike>();

		// Mock fetch
		mockFetch = fn<FunctionLike>();
		global.fetch = mockFetch;

		// Mock URL methods
		mockCreateObjectURL = fn<FunctionLike>(() => `blob:mock-url-${Math.random()}`);
		mockRevokeObjectURL = fn<FunctionLike>();
		global.URL.createObjectURL = mockCreateObjectURL;
		global.URL.revokeObjectURL = mockRevokeObjectURL;

		// Mock AbortController
		global.AbortController = mockAbortController as any;
	});

	afterEach(() => {
		mocker.restoreAllMocks();
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

	describe('file size is within the limit', () => {
		it('should fetch and open PDF', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				blob: fn<FunctionLike>().mockResolvedValueOnce(testBlob),
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
				blob: fn<FunctionLike>().mockResolvedValueOnce(testBlob),
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
				blob: fn<FunctionLike>().mockResolvedValueOnce(testBlob),
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
					blob: fn<FunctionLike>().mockResolvedValueOnce(testBlob),
				})
				.mockResolvedValueOnce({
					ok: true,
					blob: fn<FunctionLike>().mockResolvedValueOnce(testBlob),
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

		it('should revoke blob URL on component unmount', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				blob: fn<FunctionLike>().mockResolvedValueOnce(testBlob),
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
		let consoleErrorSpy: MockInstance<FunctionLike>;

		beforeEach(() => {
			consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => undefined);
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
					return Promise.resolve({ ok: true, blob: fn<FunctionLike>().mockResolvedValueOnce(testBlob) });
				});

			const { result } = renderHook(() => useOpenEncryptedPdf(), { wrapper: mockAppRoot().build() });

			const promise1 = result.current(link, title, allowedSize, format, mockOpenDocumentViewer);
			const promise2 = result.current(link, title, allowedSize, format, mockOpenDocumentViewer);

			await act(async () => {
				resolveFirstFetch({ ok: true, blob: fn<FunctionLike>().mockResolvedValue(testBlob) });
				await Promise.all([promise1, promise2]);
			});

			expect(mockOpenDocumentViewer).toHaveBeenCalledTimes(1);
			expect(mockAbort).toHaveBeenCalledTimes(1);
		});
	});
});
