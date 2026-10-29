import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import Tag from './Tag';
import * as stories from './Tag.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Tag Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('applies the pill modifier when pill is set', () => {
		const { getByText } = render(<Tag pill>john.doe</Tag>);
		const tag = getByText('john.doe').parentElement;

		expect(tag).toHaveClass('rcx-tag', 'rcx-tag--pill');
	});

	test('does not apply the pill modifier by default', () => {
		const { getByText } = render(<Tag>john.doe</Tag>);
		const tag = getByText('john.doe').parentElement;

		expect(tag).toHaveClass('rcx-tag');
		expect(tag).not.toHaveClass('rcx-tag--pill');
	});

	test('renders a span by default and a link with href', () => {
		const { rerender } = render(<Tag>john.doe</Tag>);
		expect(screen.getByText('john.doe').parentElement?.tagName).toBe('SPAN');

		rerender(<Tag href='#'>john.doe</Tag>);
		expect(screen.getByRole('link', { name: 'john.doe' })).toHaveClass('rcx-tag--clickable');
	});

	test('only a link takes href', () => {
		const button = (
			// @ts-expect-error a button is not a link
			<Tag is='button' href='#'>
				7 days
			</Tag>
		);
		const span = (
			// @ts-expect-error neither is a span
			<Tag is='span' href='#'>
				john.doe
			</Tag>
		);
		const link = (
			<Tag is='a' href='#'>
				john.doe
			</Tag>
		);

		render(
			<>
				{button}
				{span}
				{link}
			</>,
		);

		expect(screen.getAllByRole('link')).toHaveLength(1);
	});

	test('renders a clickable button that does not submit forms', () => {
		render(<Tag is='button'>7 days</Tag>);
		const tag = screen.getByRole('button', { name: '7 days' });

		expect(tag).toHaveAttribute('type', 'button');
		expect(tag).toHaveClass('rcx-tag', 'rcx-tag--button', 'rcx-tag--clickable');
	});

	test('works as a toggle with aria-pressed, from the pointer and the keyboard', async () => {
		const onClick = jest.fn();
		render(
			<Tag is='button' aria-pressed onClick={onClick}>
				7 days
			</Tag>,
		);
		const tag = screen.getByRole('button', { name: '7 days', pressed: true });

		await userEvent.click(tag);
		tag.focus();
		await userEvent.keyboard('{Enter}');

		expect(onClick).toHaveBeenCalledTimes(2);
	});

	test('disables the button when disabled', async () => {
		const onClick = jest.fn();
		render(
			<Tag is='button' disabled onClick={onClick}>
				7 days
			</Tag>,
		);
		const tag = screen.getByRole('button', { name: '7 days' });

		expect(tag).toBeDisabled();
		expect(tag).toHaveClass('rcx-tag--disabled');
		expect(tag).not.toHaveClass('rcx-tag--clickable');
	});

	test('keeps the disabled look on a disabled link', () => {
		render(
			<Tag href='#' disabled>
				john.doe
			</Tag>,
		);
		const tag = screen.getByRole('link', { name: 'john.doe' });

		expect(tag).toHaveClass('rcx-tag--disabled');
		expect(tag).not.toHaveClass('rcx-tag--clickable');
	});

	test('marks a span with onClick as clickable', () => {
		render(<Tag onClick={() => undefined}>john.doe</Tag>);
		const tag = screen.getByText('john.doe').parentElement;

		expect(tag?.tagName).toBe('SPAN');
		expect(tag).toHaveClass('rcx-tag--clickable');
	});
});
