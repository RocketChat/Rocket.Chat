import { composeStories } from '@storybook/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';

import MessageComposerInputExpandable from './MessageComposerInputExpandable';
import * as stories from './MessageComposerInputExpandable.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const tree = render(<Story />);
	expect(tree.baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

describe('MessageComposerInputExpandable expand functionality', () => {
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
		expect(expandButton).toHaveAttribute('aria-label', 'Expand');
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
		expect(textarea).toHaveStyle({ maxHeight: '500px' });
		expect(expandButton).toHaveAttribute('aria-label', 'Collapse');
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
		expect(textarea).not.toHaveStyle({ maxHeight: '500px' });
		expect(expandButton).toHaveAttribute('aria-label', 'Expand');
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
		expect(textarea).not.toHaveStyle({ maxHeight: '500px' });
	});
});
