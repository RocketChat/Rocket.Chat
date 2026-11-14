import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AccordionItem from './AccordionItem';
import { render } from '../../testing';

it('keeps a controlled item collapsed even when defaultExpanded is true', () => {
	render(
		<AccordionItem title='Title' expanded={false} defaultExpanded>
			Content
		</AccordionItem>,
	);

	expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	expect(screen.getByText('Content')).not.toHaveClass('rcx-accordion-item__panel--expanded');
});

it('does not expand a controlled collapsed item when clicked', async () => {
	const user = userEvent.setup();
	render(<AccordionItem title='Title' expanded={false} />);

	await user.click(screen.getByRole('button'));

	expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
});

it.each(['{Enter}', ' '])('does not expand a controlled collapsed item on %p', async (key) => {
	const user = userEvent.setup();
	render(<AccordionItem title='Title' expanded={false} />);

	await user.tab();
	await user.keyboard(key);

	expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
});

it('reflects changes to the controlled expanded prop', () => {
	const { rerender } = render(
		<AccordionItem title='Title' expanded defaultExpanded>
			Content
		</AccordionItem>,
	);

	expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
	expect(screen.getByText('Content')).toHaveClass('rcx-accordion-item__panel--expanded');

	rerender(
		<AccordionItem title='Title' expanded={false} defaultExpanded>
			Content
		</AccordionItem>,
	);

	expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	expect(screen.getByText('Content')).not.toHaveClass('rcx-accordion-item__panel--expanded');
});

it.each([false, true])('toggles an uncontrolled item with defaultExpanded=%p when clicked', async (defaultExpanded) => {
	const user = userEvent.setup();
	render(<AccordionItem title='Title' defaultExpanded={defaultExpanded} />);
	const button = screen.getByRole('button');

	expect(button).toHaveAttribute('aria-expanded', String(defaultExpanded));

	await user.click(button);
	expect(button).toHaveAttribute('aria-expanded', String(!defaultExpanded));

	await user.click(button);
	expect(button).toHaveAttribute('aria-expanded', String(defaultExpanded));
});

it.each(['{Enter}', ' '])('toggles an uncontrolled item on %p', async (key) => {
	const user = userEvent.setup();
	render(<AccordionItem title='Title' />);
	const button = screen.getByRole('button');

	await user.tab();
	await user.keyboard(key);
	expect(button).toHaveAttribute('aria-expanded', 'true');

	await user.keyboard(key);
	expect(button).toHaveAttribute('aria-expanded', 'false');
});
