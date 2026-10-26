import { composeStories } from '@storybook/react-webpack5';
import { fireEvent } from '@testing-library/react';
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
		const { getByRole, rerender } = render(
			<AccordionItem title='Title' expanded>
				Content
			</AccordionItem>,
		);
		expect(getByRole('button')).toHaveAttribute('aria-expanded', 'true');

		rerender(
			<AccordionItem title='Title' expanded={false}>
				Content
			</AccordionItem>,
		);
		expect(getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	});

	it('reports the next state through onToggle without changing a controlled item', () => {
		const onToggle = jest.fn();
		const { getByRole } = render(
			<AccordionItem title='Title' expanded={false} onToggle={onToggle}>
				Content
			</AccordionItem>,
		);

		fireEvent.click(getByRole('button'));

		expect(onToggle).toHaveBeenCalledWith(true);
		expect(getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	});

	it('toggles an uncontrolled item with Enter and Space', () => {
		const { getByRole } = render(<AccordionItem title='Title'>Content</AccordionItem>);

		fireEvent.keyDown(getByRole('button'), { key: 'Enter' });
		expect(getByRole('button')).toHaveAttribute('aria-expanded', 'true');

		fireEvent.keyDown(getByRole('button'), { key: ' ' });
		expect(getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	});
});
