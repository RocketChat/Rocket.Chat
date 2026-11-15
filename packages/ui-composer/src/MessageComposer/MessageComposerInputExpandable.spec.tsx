import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
		{ wrapper: mockAppRoot().build() },
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
		{ wrapper: mockAppRoot().build() },
	);

	const expandButton = screen.queryByRole('button');
	expect(expandButton).not.toBeInTheDocument();
});

test('should expand input when expand button is clicked', async () => {
	render(
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
		/>,
		{ wrapper: mockAppRoot().build() },
	);

	const expandButton = screen.getByRole('button');
	const textarea = screen.getByRole('textbox');

	// Initially not expanded
	expect(textarea).not.toHaveStyle({ height: '500px' });

	// Click to expand
	await userEvent.click(expandButton);

	// Should be expanded now
	expect(textarea).toHaveStyle({ height: '500px' });
	expect(textarea).toHaveStyle({ maxHeight: '50vh' });
	expect(expandButton).toHaveAttribute('title', 'Collapse');
});

test('should collapse input when collapse button is clicked', async () => {
	render(
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
		/>,
		{ wrapper: mockAppRoot().build() },
	);

	const expandButton = screen.getByRole('button');
	const textarea = screen.getByRole('textbox');

	// Expand first
	await userEvent.click(expandButton);
	expect(textarea).toHaveStyle({ height: '500px' });

	// Click to collapse
	await userEvent.click(expandButton);

	// Should be collapsed now
	expect(textarea).not.toHaveStyle({ height: '500px' });
	expect(textarea).not.toHaveStyle({ maxHeight: '50vh' });
	expect(expandButton).toHaveAttribute('title', 'Expand');
});

test('should auto-collapse when input is cleared', async () => {
	render(
		<MessageComposerInputExpandable
			dimensions={{
				inlineSize: 400,
				blockSize: 120,
			}}
			placeholder='Type a message...'
		/>,
		{ wrapper: mockAppRoot().build() },
	);

	const expandButton = screen.getByRole('button');
	const textarea = screen.getByRole('textbox');

	// Expand first
	await userEvent.click(expandButton);
	expect(textarea).toHaveStyle({ height: '500px' });

	// Type some text
	await userEvent.type(textarea, 'Some text');
	expect(textarea).toHaveStyle({ height: '500px' });

	// Clear the text
	await userEvent.clear(textarea);

	// Should auto-collapse
	expect(textarea).not.toHaveStyle({ height: '500px' });
	expect(textarea).not.toHaveStyle({ maxHeight: '50vh' });
});
