import { screen } from '@testing-library/react';

import MessageGenericPreviewImage from './MessageGenericPreviewImage.js';
import { render } from '../../../testing.js';

describe('MessageGenericPreviewImage', () => {
	it('renders without crashing', () => {
		render(<MessageGenericPreviewImage url='test.jpg' />);
	});

	it('should render image', () => {
		render(<MessageGenericPreviewImage url='test.jpg' />);
		const previewImage = screen.getByRole('presentation');

		expect(previewImage).toBeInTheDocument();
		expect(previewImage).toHaveAttribute('src', 'test.jpg');
	});
});
