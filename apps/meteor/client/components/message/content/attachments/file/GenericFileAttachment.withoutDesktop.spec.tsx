import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GenericFileAttachment from './GenericFileAttachment';

const mockOpenEncryptedPdf = jest.fn();
const mockDispatchToastMessage = jest.fn();
const mockForAttachmentDownload = jest.fn();
const mockRegisterDownloadForUid = jest.fn();

jest.mock('./hooks/useOpenEncryptedPdf', () => ({
	useOpenEncryptedPdf: () => mockOpenEncryptedPdf,
}));

jest.mock('../../../../../hooks/useDownloadFromServiceWorker', () => ({
	...jest.requireActual('../../../../../hooks/useDownloadFromServiceWorker'),
	forAttachmentDownload: (...args: unknown[]) => mockForAttachmentDownload(...args),
	registerDownloadForUid: (...args: unknown[]) => mockRegisterDownloadForUid(...args),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useMediaUrl: () => (url: string) => url,
	useToastMessageDispatch: () => mockDispatchToastMessage,
}));

const clickTitle = async (title: string) => {
	const occurrences = screen.getAllByText(title);
	await userEvent.click(occurrences[occurrences.length - 1]);
};

beforeEach(() => {
	jest.clearAllMocks();
});

/**
 * `window.RocketChatDesktop` is deliberately never installed in this file. The component captures it at
 * module scope, so the web build's behaviour can only be exercised from a spec that never defines it.
 */
describe('GenericFileAttachment without the desktop API', () => {
	it('should leave a plain markdown attachment to the browser instead of a viewer', async () => {
		render(
			<GenericFileAttachment
				title='notes.md'
				title_link='/file-upload/id/notes.md'
				title_link_download={true}
				format='MD'
				collapsed={false}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		await clickTitle('notes.md');

		expect(mockForAttachmentDownload).not.toHaveBeenCalled();
		expect(mockRegisterDownloadForUid).not.toHaveBeenCalled();
		expect(mockDispatchToastMessage).not.toHaveBeenCalled();
	});

	it('should leave a plain PDF to the browser instead of a viewer', async () => {
		render(
			<GenericFileAttachment
				title='report.pdf'
				title_link='/file-upload/id/report.pdf'
				title_link_download={true}
				format='PDF'
				collapsed={false}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		await clickTitle('report.pdf');

		expect(mockOpenEncryptedPdf).not.toHaveBeenCalled();
		expect(mockForAttachmentDownload).not.toHaveBeenCalled();
	});

	it('should still route an encrypted attachment through the service worker download', async () => {
		const link = '/file-decrypt/id/notes.md';

		render(<GenericFileAttachment title='notes.md' title_link={link} title_link_download={true} format='MD' collapsed={false} />, {
			wrapper: mockAppRoot().build(),
		});

		await clickTitle('notes.md');

		expect(mockRegisterDownloadForUid).toHaveBeenCalled();
		expect(mockForAttachmentDownload).toHaveBeenCalledWith(expect.any(String), link);
	});
});
