import { TooltipProvider } from '@rocket.chat/ui-client';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ContextType } from 'react';

import EmojiElement from './EmojiElement';
import { EmojiPickerContext } from '../../../contexts/EmojiPickerContext';

const image = '<span class="emoji" title=":grin:">😁</span>';

const setup = (initialImage = image) => {
	const context: NonNullable<ContextType<typeof EmojiPickerContext>> = {
		open: jest.fn(),
		close: jest.fn(),
		isOpen: true,
		emojiToPreview: null,
		handlePreview: jest.fn(),
		handleRemovePreview: jest.fn(),
		addRecentEmoji: jest.fn(),
		emojiListByCategory: [],
		categoriesIndexes: [],
		recentEmojis: [],
		setRecentEmojis: jest.fn(),
		actualTone: 0,
		setActualTone: jest.fn(),
		currentCategory: 'people',
		setCurrentCategory: jest.fn(),
		customItemsLimit: 90,
		setCustomItemsLimit: jest.fn(),
		quickReactions: [],
	};
	const onClick = jest.fn();
	const element = (value = context, emojiImage = initialImage) => (
		<TooltipProvider>
			<EmojiPickerContext.Provider value={value}>
				<EmojiElement emoji='grin' image={emojiImage} onClick={onClick} />
			</EmojiPickerContext.Provider>
		</TooltipProvider>
	);
	const { rerender } = render(element());

	return { context, onClick, rerender: (value = context, emojiImage = initialImage) => rerender(element(value, emojiImage)) };
};

it('keeps the active tooltip anchor connected when the preview changes', async () => {
	const user = userEvent.setup();
	const { context, rerender } = setup();
	const button = screen.getByRole('button', { name: 'grin' });
	const anchor = within(button).getByText('😁');

	await user.hover(anchor);
	expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(':grin:');
	expect(anchor).toHaveAttribute('title', '');
	expect(anchor).toHaveAttribute('data-title', ':grin:');

	rerender({ ...context, emojiToPreview: { emoji: image, name: 'grin' } });

	expect(anchor).toBeInTheDocument();
	expect(within(button).getByText('😁')).toBe(anchor);
	expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(':grin:');
	expect(anchor).toHaveAttribute('title', '');
	expect(anchor).toHaveAttribute('data-title', ':grin:');

	await user.unhover(anchor);
	expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
	expect(anchor).toHaveAttribute('title', ':grin:');
	expect(anchor).not.toHaveAttribute('data-title');
});

it('updates and sanitizes the markup when the image changes', () => {
	const { context, rerender } = setup();

	rerender(context, '<img src="custom-emoji.png" alt="Custom emoji" onerror="alert(1)">');

	expect(screen.queryByText('😁')).not.toBeInTheDocument();
	expect(screen.getByRole('img', { name: 'Custom emoji' })).toHaveAttribute('src', 'custom-emoji.png');
	expect(screen.getByRole('img', { name: 'Custom emoji' })).not.toHaveAttribute('onerror');
});

it('keeps preview and selection handlers working after a preview update', async () => {
	const user = userEvent.setup();
	const { context, onClick, rerender } = setup();
	const button = screen.getByRole('button', { name: 'grin' });

	await user.hover(button);
	expect(context.handlePreview).toHaveBeenCalledWith(image, 'grin');

	rerender({ ...context, emojiToPreview: { emoji: image, name: 'grin' } });

	await user.unhover(button);
	expect(context.handleRemovePreview).toHaveBeenCalledTimes(1);

	await user.click(button);
	expect(onClick).toHaveBeenCalledTimes(1);
	expect(button).toHaveAttribute('data-emoji', 'grin');
});

it('handles an image appearing and disappearing', () => {
	const { context, rerender } = setup('');

	expect(screen.queryByRole('button', { name: 'grin' })).not.toBeInTheDocument();

	rerender(context, image);
	expect(screen.getByRole('button', { name: 'grin' })).toBeInTheDocument();

	rerender(context, '');
	expect(screen.queryByRole('button', { name: 'grin' })).not.toBeInTheDocument();
});
