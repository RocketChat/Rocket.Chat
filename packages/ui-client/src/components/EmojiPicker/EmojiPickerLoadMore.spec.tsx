import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EmojiPickerLoadMore from './EmojiPickerLoadMore';

describe('EmojiPickerLoadMore', () => {
	it('should render children inside the button', () => {
		render(<EmojiPickerLoadMore>Load More Emojis</EmojiPickerLoadMore>);
		expect(screen.getByRole('button', { name: /load more emojis/i })).toBeInTheDocument();
	});

	it('should call onClick when button is clicked', async () => {
		const handleClick = jest.fn();

		render(<EmojiPickerLoadMore onClick={handleClick}>Load More</EmojiPickerLoadMore>);

		await userEvent.click(screen.getByRole('button', { name: /load more/i }));

		expect(handleClick).toHaveBeenCalled();
	});

	it('should pass additional props to the button', () => {
		render(<EmojiPickerLoadMore aria-label='custom-label'>More</EmojiPickerLoadMore>);

		expect(screen.getByRole('button', { name: 'custom-label' })).toHaveAttribute('aria-label', 'custom-label');
	});
});
