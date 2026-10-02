import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ImageGalleryProvider from './ImageGalleryProvider';

jest.mock('../components/ImageGallery/ImageGallery', () => ({
	ImageGallery: ({ images, onClose }: { images: { url: string }[]; onClose: () => void }) => (
		<div role='dialog' aria-label='gallery'>
			{images.map(({ url }) => url).join(',')}
			<button onClick={onClose}>close gallery</button>
		</div>
	),
}));

jest.mock('../views/room/ImageGallery/ImageGalleryData', () => () => <div role='dialog' aria-label='room gallery' />);

it('loads the gallery only once an image is clicked', async () => {
	render(
		<ImageGalleryProvider>
			<img className='preview-image' data-id='/image.png' alt='preview' />
		</ImageGalleryProvider>,
		{ wrapper: mockAppRoot().build() },
	);

	expect(screen.queryByRole('dialog', { name: 'gallery' })).not.toBeInTheDocument();

	await userEvent.click(screen.getByAltText('preview'));

	expect(await screen.findByRole('dialog', { name: 'gallery' })).toHaveTextContent('/image.png');

	await userEvent.click(screen.getByRole('button', { name: 'close gallery' }));

	expect(screen.queryByRole('dialog', { name: 'gallery' })).not.toBeInTheDocument();
});

it('opens the room gallery for gallery items', async () => {
	render(
		<ImageGalleryProvider>
			<div className='gallery-item' data-id='upload-id'>
				item
			</div>
		</ImageGalleryProvider>,
		{ wrapper: mockAppRoot().build() },
	);

	await userEvent.click(screen.getByText('item'));

	expect(await screen.findByRole('dialog', { name: 'room gallery' })).toBeInTheDocument();
});
