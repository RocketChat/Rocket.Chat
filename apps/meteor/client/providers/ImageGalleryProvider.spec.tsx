import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';

import ImageGalleryProvider from './ImageGalleryProvider';
import { ImageGalleryContext } from '../contexts/ImageGalleryContext';

jest.mock('../views/room/ImageGallery/ImageGalleryData', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('../components/ImageGallery', () => ({
	ImageGallery: () => null,
}));

const OpenedImage = () => {
	const { imageId } = useContext(ImageGalleryContext);
	return <output aria-label='Opened image'>{imageId}</output>;
};

const renderProvider = () =>
	render(
		<ImageGalleryProvider>
			<button type='button' className='gallery-item' data-id='image-1'>
				<span>photo.png</span>
			</button>
			<button type='button'>Unrelated</button>
			<OpenedImage />
		</ImageGalleryProvider>,
	);

it('opens the gallery from text nested inside a gallery item', async () => {
	renderProvider();

	await userEvent.click(screen.getByText('photo.png'));

	expect(screen.getByRole('status', { name: 'Opened image' })).toHaveTextContent('image-1');
});

it('opens the gallery from the gallery item itself', async () => {
	renderProvider();

	await userEvent.click(screen.getByRole('button', { name: 'photo.png' }));

	expect(screen.getByRole('status', { name: 'Opened image' })).toHaveTextContent('image-1');
});

it('ignores clicks outside gallery items', async () => {
	renderProvider();

	await userEvent.click(screen.getByRole('button', { name: 'Unrelated' }));

	expect(screen.getByRole('status', { name: 'Opened image' })).toBeEmptyDOMElement();
});
