import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './Accordion.stories';
import AccordionItem from './AccordionItem';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

describe('[AccordionItem expanded]', () => {
	it('collapses when expanded changes to false', () => {
		const { rerender } = render(
			<AccordionItem title='Title' expanded>
				Content
			</AccordionItem>,
		);
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');

		rerender(
			<AccordionItem title='Title' expanded={false}>
				Content
			</AccordionItem>,
		);
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	});

	it('reports the next state through onToggle without changing a controlled item', async () => {
		const user = userEvent.setup();
		const onToggle = jest.fn();
		render(
			<AccordionItem title='Title' expanded={false} onToggle={onToggle}>
				Content
			</AccordionItem>,
		);

		await user.click(screen.getByRole('button'));

		expect(onToggle).toHaveBeenCalledWith(true);
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	});

	it('toggles an uncontrolled item with Enter and Space', async () => {
		const user = userEvent.setup();
		render(<AccordionItem title='Title'>Content</AccordionItem>);

		await user.tab();
		await user.keyboard('{Enter}');
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');

		await user.keyboard(' ');
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	});
});
