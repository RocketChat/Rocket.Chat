import { screen } from '@testing-library/react';

import MessageGenericPreviewImage from './MessageGenericPreviewImage';
import { render } from '../../../testing';

describe('MessageGenericPreviewImage', () => {
	it('should render image', () => {
		render(<MessageGenericPreviewImage url='test.jpg' />);
		const previewImage = screen.getByRole('presentation');

		expect(previewImage).toBeInTheDocument();
		expect(previewImage).toHaveAttribute('src', 'test.jpg');
	});
});
