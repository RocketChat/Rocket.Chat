import { render, screen, fireEvent } from '@testing-library/react';

import MessageComposerInputExpandable from './MessageComposerInputExpandable';

test('should show expand button when dimensions.blockSize > 100', () => {
	render(
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
		/>,
	);

	const expandButton = screen.getByRole('button');
	expect(expandButton).toBeInTheDocument();
	expect(expandButton).toHaveAttribute('title', 'Expand');
});

test('should not show expand button when dimensions.blockSize <= 100', () => {
	render(
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 80,
			}}
			placeholder='Type a message...'
		/>,
	);

	const expandButton = screen.queryByRole('button');
	expect(expandButton).not.toBeInTheDocument();
});

test('should expand input when expand button is clicked', () => {
	render(
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
		/>,
	);

	const expandButton = screen.getByRole('button');
	const textarea = screen.getByRole('textbox');

	// Initially not expanded
	expect(textarea).not.toHaveStyle({ height: '500px' });

	// Click to expand
	fireEvent.click(expandButton);

	// Should be expanded now
	expect(textarea).toHaveStyle({ height: '500px' });
	expect(textarea).toHaveStyle({ maxHeight: '50vh' });
	expect(expandButton).toHaveAttribute('title', 'Collapse');
});

test('should collapse input when collapse button is clicked', () => {
	render(
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
		/>,
	);

	const expandButton = screen.getByRole('button');
	const textarea = screen.getByRole('textbox');

	// Expand first
	fireEvent.click(expandButton);
	expect(textarea).toHaveStyle({ height: '500px' });

	// Click to collapse
	fireEvent.click(expandButton);

	// Should be collapsed now
	expect(textarea).not.toHaveStyle({ height: '500px' });
	expect(textarea).not.toHaveStyle({ maxHeight: '50vh' });
	expect(expandButton).toHaveAttribute('title', 'Expand');
});

test('should auto-collapse when input is cleared', () => {
	render(
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
		/>,
	);

	const expandButton = screen.getByRole('button');
	const textarea = screen.getByRole('textbox');

	// Expand first
	fireEvent.click(expandButton);
	expect(textarea).toHaveStyle({ height: '500px' });

	// Type some text
	fireEvent.change(textarea, { target: { value: 'Some text' } });
	expect(textarea).toHaveStyle({ height: '500px' });

	// Clear the text
	fireEvent.change(textarea, { target: { value: '' } });

	// Should auto-collapse
	expect(textarea).not.toHaveStyle({ height: '500px' });
	expect(textarea).not.toHaveStyle({ maxHeight: '50vh' });
});
