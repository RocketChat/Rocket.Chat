import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Held in module-scope bindings so the mock factories below hand back stable references.
const mockOpenEncryptedPdf = jest.fn();
const mockDispatchToastMessage = jest.fn();
const mockForAttachmentDownload = jest.fn();
const mockRegisterDownloadForUid = jest.fn();
const mockOpenDocumentViewer = jest.fn();
const mockSupportedDocumentViewerFormats = jest.fn(() => ['pdf', 'markdown']);

jest.mock('./hooks/useOpenEncryptedPdf', () => ({
	useOpenEncryptedPdf: () => mockOpenEncryptedPdf,
}));

jest.mock('../../../../../hooks/useDownloadFromServiceWorker', () => ({
	// The encrypted download UI renders the real `useDownloadFromServiceWorker` hook, so only the two
	// functions under assertion are replaced.
	...jest.requireActual('../../../../../hooks/useDownloadFromServiceWorker'),
	forAttachmentDownload: (...args: unknown[]) => mockForAttachmentDownload(...args),
	registerDownloadForUid: (...args: unknown[]) => mockRegisterDownloadForUid(...args),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useMediaUrl: () => (url: string) => url,
	useToastMessageDispatch: () => mockDispatchToastMessage,
}));

// `GenericFileAttachment` reads `window.RocketChatDesktop` at module scope, so the stub has to be in
// place before the module is first loaded. `import` is hoisted and would run too early, hence the
// explicit `require` below. Tests vary behaviour through the stub's implementations rather than by
// re-importing the module: an isolated re-import pulls in a second copy of React and breaks hooks.
window.RocketChatDesktop = {
	openDocumentViewer: mockOpenDocumentViewer,
	supportedDocumentViewerFormats: mockSupportedDocumentViewerFormats,
} as any;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const GenericFileAttachment = require('./GenericFileAttachment').default;

/** Built the same way the component builds it, so the assertion does not depend on the jsdom origin. */
const inlineUrl = (path: string) => {
	const url = new URL(path, window.location.origin);
	url.searchParams.set('contentDisposition', 'inline');
	return url.toString();
};

const renderAttachment = (attachment: Record<string, unknown>) =>
	render(<GenericFileAttachment {...attachment} />, { wrapper: mockAppRoot().build() });

/**
 * The title string renders twice: once in `MessageCollapsible`'s header and once as the preview title
 * that carries the click handler. The clickable one is the later of the two.
 */
const clickTitle = async (title: string) => {
	const occurrences = screen.getAllByText(title);
	await userEvent.click(occurrences[occurrences.length - 1]);
};

beforeEach(() => {
	jest.clearAllMocks();
	mockSupportedDocumentViewerFormats.mockReturnValue(['pdf', 'markdown']);
});

describe('GenericFileAttachment', () => {
	describe('PDF attachments', () => {
		it('should open a plain PDF in the desktop viewer with an inline content disposition', async () => {
			renderAttachment({
				title: 'report.pdf',
				title_link: '/file-upload/id/report.pdf',
				title_link_download: true,
				format: 'PDF',
				collapsed: false,
			});

			await clickTitle('report.pdf');

			expect(mockOpenDocumentViewer).toHaveBeenCalledWith(inlineUrl('/file-upload/id/report.pdf'), 'PDF', '');
			expect(mockOpenEncryptedPdf).not.toHaveBeenCalled();
		});

		it('should delegate an encrypted PDF to useOpenEncryptedPdf', async () => {
			const link = '/file-decrypt/id/report.pdf';

			renderAttachment({
				title: 'report.pdf',
				title_link: link,
				title_link_download: true,
				size: 2048,
				format: 'PDF',
				collapsed: false,
			});

			await clickTitle('report.pdf');

			expect(mockOpenEncryptedPdf).toHaveBeenCalledWith(link, 'report.pdf', 2048, 'PDF', mockOpenDocumentViewer);
			expect(mockOpenDocumentViewer).not.toHaveBeenCalled();
		});
	});

	describe('markdown attachments', () => {
		it.each([
			['MD', 'notes.md'],
			['MARKDOWN', 'notes.markdown'],
		])('should open a %s attachment in the desktop viewer', async (format, title) => {
			renderAttachment({
				title,
				title_link: `/file-upload/id/${title}`,
				title_link_download: true,
				format,
				collapsed: false,
			});

			await clickTitle(title);

			expect(mockOpenDocumentViewer).toHaveBeenCalledWith(inlineUrl(`/file-upload/id/${title}`), 'markdown', '');
		});

		it('should fall through when the desktop viewer does not support markdown', async () => {
			mockSupportedDocumentViewerFormats.mockReturnValue(['pdf']);

			renderAttachment({
				title: 'notes.md',
				title_link: '/file-upload/id/notes.md',
				title_link_download: true,
				format: 'MD',
				collapsed: false,
			});

			await clickTitle('notes.md');

			expect(mockOpenDocumentViewer).not.toHaveBeenCalled();
		});

		it('should route an encrypted markdown file to the download path instead of the viewer', async () => {
			const link = '/file-decrypt/id/notes.md';

			renderAttachment({
				title: 'notes.md',
				title_link: link,
				title_link_download: true,
				format: 'MD',
				collapsed: false,
			});

			await clickTitle('notes.md');

			expect(mockOpenDocumentViewer).not.toHaveBeenCalled();
			expect(mockRegisterDownloadForUid).toHaveBeenCalled();
			expect(mockForAttachmentDownload).toHaveBeenCalledWith(expect.any(String), link);
		});
	});

	describe('other attachments', () => {
		it('should register a service worker download for an encrypted non-previewable file', async () => {
			const link = '/file-decrypt/id/archive.zip';

			renderAttachment({
				title: 'archive.zip',
				title_link: link,
				title_link_download: true,
				format: 'ZIP',
				collapsed: false,
			});

			await clickTitle('archive.zip');

			expect(mockOpenDocumentViewer).not.toHaveBeenCalled();
			expect(mockForAttachmentDownload).toHaveBeenCalledWith(expect.any(String), link);
		});

		it('should dispatch an error toast when the desktop viewer throws', async () => {
			mockOpenDocumentViewer.mockImplementation(() => {
				throw new Error('viewer unavailable');
			});

			renderAttachment({
				title: 'notes.md',
				title_link: '/file-upload/id/notes.md',
				title_link_download: true,
				format: 'MD',
				collapsed: false,
			});

			await clickTitle('notes.md');

			expect(mockDispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: 'FileUpload_Error_Trying_To_Open_File' });
		});
	});
});
