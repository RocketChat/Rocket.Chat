import { composeStories } from '@storybook/react-vite';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './SplitButton.stories';
import { render } from '../../testing';

const { Default, Danger, Variants } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[SplitButton Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('renders a named group with the menu trigger and the action', () => {
		render(<Default />);

		expect(screen.getByRole('group', { name: 'Microphone' })).toHaveClass('rcx-split-button');
		const trigger = screen.getByRole('button', { name: 'Audio settings' });
		expect(trigger).toHaveAttribute('aria-haspopup', 'true');
		expect(trigger).toHaveClass('rcx-split-button__trigger');
		expect(screen.getByRole('button', { name: 'Microphone' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('toggles the action without opening the menu', async () => {
		render(<Default />);

		await userEvent.click(screen.getByRole('button', { name: 'Microphone' }));

		expect(screen.getByRole('button', { name: 'Microphone' })).toHaveAttribute('aria-pressed', 'false');
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	it('opens the menu from the trigger', async () => {
		render(<Default />);

		const trigger = screen.getByRole('button', { name: 'Audio settings' });
		await userEvent.click(trigger);

		expect(screen.getByRole('menu')).toBeInTheDocument();
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('marks the group as danger', () => {
		render(<Danger />);

		expect(screen.getByRole('group', { name: 'Leave call' })).toHaveClass('rcx-split-button--danger');
	});

	it.each([
		['Leave call', 'danger'],
		['Raise hand', 'warning'],
		['Answer call', 'success'],
		['Camera', 'primary'],
	])('marks the %s group as %s', (name, variant) => {
		render(<Variants />);

		expect(screen.getByRole('group', { name })).toHaveClass(`rcx-split-button--${variant}`);
	});
});
