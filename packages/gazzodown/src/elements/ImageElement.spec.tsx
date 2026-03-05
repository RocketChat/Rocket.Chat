import { render, screen } from '@testing-library/react';

import ImageElement from './ImageElement';

describe('ImageElement', () => {
	it('renders an image with link', () => {
		render(<ImageElement src='https://example.com/img.png' alt={{ type: 'PLAIN_TEXT', value: 'Alt text' }} />);
		const img = screen.getByRole('img');
		expect(img).toHaveAttribute('src', 'https://example.com/img.png');
		expect(img).toHaveAttribute('alt', 'Alt text');
	});

	it('opens image in new tab', () => {
		render(<ImageElement src='https://example.com/img.png' alt={{ type: 'PLAIN_TEXT', value: 'Photo' }} />);
		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('flattens nested markup for alt text', () => {
		render(<ImageElement src='https://example.com/img.png' alt={{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'Bold alt' }] }} />);
		expect(screen.getByRole('img')).toHaveAttribute('alt', 'Bold alt');
	});

	it('matches snapshot', () => {
		const { container } = render(<ImageElement src='https://example.com/img.png' alt={{ type: 'PLAIN_TEXT', value: 'Snapshot image' }} />);
		expect(container).toMatchSnapshot();
	});
});
