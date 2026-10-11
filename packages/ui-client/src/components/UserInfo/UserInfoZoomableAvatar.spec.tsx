import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserInfoZoomableAvatar from './UserInfoZoomableAvatar';
import type { ImageGalleryComponentProps } from '../ImageGalleryContext';
import { ImageGalleryContext } from '../ImageGalleryContext';

const Gallery = ({ images, onClose }: ImageGalleryComponentProps) => (
	<div role='dialog' aria-label={images[0].description}>
		<button type='button' onClick={onClose}>
			close
		</button>
	</div>
);

it('opens the avatar in the provided gallery and closes it again', async () => {
	render(
		<ImageGalleryContext.Provider value={Gallery}>
			<UserInfoZoomableAvatar username='jane.doe' />
		</ImageGalleryContext.Provider>,
		{ wrapper: mockAppRoot().build() },
	);

	await userEvent.click(screen.getByRole('button', { name: 'View_avatar' }));
	expect(screen.getByRole('dialog', { name: 'Avatar_of' })).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'close' }));
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('shows a plain avatar when no gallery is provided', () => {
	const { container } = render(<UserInfoZoomableAvatar username='jane.doe' />, { wrapper: mockAppRoot().build() });

	expect(screen.queryByRole('button', { name: 'View_avatar' })).not.toBeInTheDocument();
	expect(container.querySelector('img')).toBeInTheDocument();
});
