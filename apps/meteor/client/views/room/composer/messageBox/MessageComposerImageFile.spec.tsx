import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';

import MessageComposerImageFile from './MessageComposerImageFile';
import type { Upload } from '../../../../lib/chats/Upload';

jest.mock('../../../../lib/getURL', () => ({
	getURL: (path: string) => `https://host${path}`,
}));

const mockImageLoading = (outcome: 'load' | 'error') => {
	jest.spyOn(window, 'Image').mockImplementation(() => {
		const image = {} as HTMLImageElement;
		Object.defineProperty(image, 'src', {
			set: () => setTimeout(() => (outcome === 'load' ? image.onload : image.onerror)?.call(image, new Event(outcome))),
		});
		return image;
	});
};

const handlers = { onRemove: jest.fn(), onEdit: jest.fn(), onCancel: jest.fn(), disabled: false };

const renderFile = (upload: Upload) =>
	render(<MessageComposerImageFile upload={upload} {...handlers} />, { wrapper: mockAppRoot().build() });

afterEach(() => {
	jest.restoreAllMocks();
});

it('previews an image once it loads', async () => {
	mockImageLoading('load');

	renderFile({
		id: 'file-1',
		file: new File(['png'], 'photo.png', { type: 'image/png' }),
		url: '/file-upload/file-1/photo.png',
		percentage: 100,
	});

	await waitFor(() => expect(screen.getByRole('presentation')).toHaveAttribute('src', expect.stringMatching(/^data:image\/png/)));
});

it('shows a file that does not render as an image as a plain file', async () => {
	mockImageLoading('error');

	renderFile({
		id: 'file-1',
		file: new File(['%PDF-1.3'], 'sample.png', { type: 'image/png' }),
		url: '/file-upload/file-1/sample.png',
		percentage: 100,
	});

	expect(await screen.findByText('sample.png')).toBeInTheDocument();
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
});

it('previews a restored upload from its url', async () => {
	mockImageLoading('load');

	renderFile({
		id: 'file-1',
		file: new File([], 'photo.png', { type: 'image/png' }),
		url: '/file-upload/file-1/photo.png',
		percentage: 100,
		restored: true,
	});

	await waitFor(() => expect(screen.getByRole('presentation')).toHaveAttribute('src', 'https://host/file-upload/file-1/photo.png'));
});
