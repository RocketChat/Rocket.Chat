import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';

import GenericFileAttachment from './GenericFileAttachment';
import type { DocumentViewer, MessageMediaContextValue } from '../../../contexts/MessageMediaContext';
import { MessageMediaContext, messageMediaDefaultValue } from '../../../contexts/MessageMediaContext';

const mockDispatchToastMessage = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useMediaUrl: () => (url: string) => url,
	useToastMessageDispatch: () => mockDispatchToastMessage,
}));

const openEncryptedPdf = jest.fn(async () => undefined);
const downloadEncrypted = jest.fn();
const openDocument = jest.fn();

const desktopViewer = (supportedFormats = ['markdown']): DocumentViewer => ({ supportedFormats, open: openDocument });

/** Built the same way the component builds it, so the assertion does not depend on the jsdom origin. */
const inlineUrl = (path: string) => {
	const url = new URL(path, window.location.origin);
	url.searchParams.set('contentDisposition', 'inline');
	return url.toString();
};

const renderAttachment = (
	attachment: ComponentProps<typeof GenericFileAttachment>,
	{ documentViewer }: Pick<MessageMediaContextValue, 'documentViewer'> = { documentViewer: desktopViewer() },
) => {
	const AppRoot = mockAppRoot().build();
	const media: MessageMediaContextValue = { ...messageMediaDefaultValue, openEncryptedPdf, downloadEncrypted, documentViewer };

	return render(<GenericFileAttachment {...attachment} />, {
		wrapper: ({ children }: { children: ReactNode }) => (
			<AppRoot>
				<MessageMediaContext.Provider value={media}>{children}</MessageMediaContext.Provider>
			</AppRoot>
		),
	});
};

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
});

describe('GenericFileAttachment', () => {
	describe('PDF attachments', () => {
		it('should open a plain PDF in the document viewer with an inline content disposition', async () => {
			renderAttachment({
				title: 'report.pdf',
				title_link: '/file-upload/id/report.pdf',
				title_link_download: true,
				format: 'PDF',
				collapsed: false,
			});

			await clickTitle('report.pdf');

			expect(openDocument).toHaveBeenCalledWith(inlineUrl('/file-upload/id/report.pdf'), 'PDF');
			expect(openEncryptedPdf).not.toHaveBeenCalled();
		});

		it('should open an encrypted PDF through openEncryptedPdf', async () => {
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

			expect(openEncryptedPdf).toHaveBeenCalledWith(link, { title: 'report.pdf', size: 2048, format: 'PDF' });
			expect(openDocument).not.toHaveBeenCalled();
		});
	});

	describe('markdown attachments', () => {
		it.each([
			['MD', 'notes.md'],
			['MARKDOWN', 'notes.markdown'],
		])('should open a %s attachment in the document viewer', async (format, title) => {
			renderAttachment({
				title,
				title_link: `/file-upload/id/${title}`,
				title_link_download: true,
				format,
				collapsed: false,
			});

			await clickTitle(title);

			expect(openDocument).toHaveBeenCalledWith(inlineUrl(`/file-upload/id/${title}`), 'markdown');
		});

		it('should fall through when the document viewer does not support markdown', async () => {
			renderAttachment(
				{
					title: 'notes.md',
					title_link: '/file-upload/id/notes.md',
					title_link_download: true,
					format: 'MD',
					collapsed: false,
				},
				{ documentViewer: desktopViewer([]) },
			);

			await clickTitle('notes.md');

			expect(openDocument).not.toHaveBeenCalled();
		});

		it('should download an encrypted markdown file instead of opening the viewer', async () => {
			const link = '/file-decrypt/id/notes.md';

			renderAttachment({
				title: 'notes.md',
				title_link: link,
				title_link_download: true,
				format: 'MD',
				collapsed: false,
			});

			await clickTitle('notes.md');

			expect(openDocument).not.toHaveBeenCalled();
			expect(downloadEncrypted).toHaveBeenCalledWith(link, 'notes.md');
		});
	});

	describe('other attachments', () => {
		it('should download an encrypted non-previewable file', async () => {
			const link = '/file-decrypt/id/archive.zip';

			renderAttachment({
				title: 'archive.zip',
				title_link: link,
				title_link_download: true,
				format: 'ZIP',
				collapsed: false,
			});

			await clickTitle('archive.zip');

			expect(openDocument).not.toHaveBeenCalled();
			expect(downloadEncrypted).toHaveBeenCalledWith(link, 'archive.zip');
		});

		it('should dispatch an error toast when the document viewer throws', async () => {
			openDocument.mockImplementationOnce(() => {
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

	describe('without a document viewer', () => {
		it('should leave a plain markdown attachment to the browser', async () => {
			renderAttachment(
				{ title: 'notes.md', title_link: '/file-upload/id/notes.md', title_link_download: true, format: 'MD', collapsed: false },
				{ documentViewer: undefined },
			);

			await clickTitle('notes.md');

			expect(downloadEncrypted).not.toHaveBeenCalled();
			expect(mockDispatchToastMessage).not.toHaveBeenCalled();
		});

		it('should leave a plain PDF to the browser', async () => {
			renderAttachment(
				{ title: 'report.pdf', title_link: '/file-upload/id/report.pdf', title_link_download: true, format: 'PDF', collapsed: false },
				{ documentViewer: undefined },
			);

			await clickTitle('report.pdf');

			expect(openEncryptedPdf).not.toHaveBeenCalled();
			expect(downloadEncrypted).not.toHaveBeenCalled();
		});

		it('should still download an encrypted attachment', async () => {
			const link = '/file-decrypt/id/notes.md';

			renderAttachment(
				{ title: 'notes.md', title_link: link, title_link_download: true, format: 'MD', collapsed: false },
				{ documentViewer: undefined },
			);

			await clickTitle('notes.md');

			expect(downloadEncrypted).toHaveBeenCalledWith(link, 'notes.md');
		});
	});
});
