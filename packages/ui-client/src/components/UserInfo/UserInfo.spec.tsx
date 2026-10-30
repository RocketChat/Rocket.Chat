import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './UserInfo.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

test('shows the local time of a UTC+0 user without printing a stray "0"', () => {
	const { Default } = composeStories(stories);
	const { container } = render(<Default utcOffset={0} />);

	expect(screen.getByText('Local_Time')).toBeInTheDocument();
	expect(screen.getByText(/\(UTC \+0\)/)).toBeInTheDocument();

	const strayZeroTextNodes = [...container.querySelectorAll('*')]
		.flatMap((element) => [...element.childNodes])
		.filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '0');
	expect(strayZeroTextNodes).toHaveLength(0);
});

test('shows the local time of a user in a fractional offset time zone', () => {
	const { Default } = composeStories(stories);
	render(<Default utcOffset={5.5} />);

	expect(screen.getByText('Local_Time')).toBeInTheDocument();
	expect(screen.getByText(/\(UTC \+5\.5\)/)).toBeInTheDocument();
});

test('renders the bio through renderMarkdown', () => {
	const { Default } = composeStories(stories);
	render(<Default bio='Rendered bio' renderMarkdown={(content) => <strong>{content}</strong>} />);

	expect(screen.getByText('Rendered bio').tagName).toBe('STRONG');
});

test('renders the bio as plain text by default', () => {
	const { Default } = composeStories(stories);
	render(<Default bio='Plain bio' />);

	expect(screen.getByText('Plain bio')).toBeInTheDocument();
});

describe('custom fields', () => {
	const wrapper = mockAppRoot()
		.withSetting('Accounts_CustomFieldsToShowInUserInfo', JSON.stringify([{ Department: 'department' }]))
		.build();

	test('renders a custom field value through renderMarkdown', () => {
		const { Default } = composeStories(stories);
		render(<Default customFields={{ department: 'Engineering' }} renderMarkdown={(content) => <em>{content}</em>} />, { wrapper });

		expect(screen.getByText('Department')).toBeInTheDocument();
		expect(screen.getByText('Engineering').tagName).toBe('EM');
	});

	test('renders a custom field value as plain text by default', () => {
		const { Default } = composeStories(stories);
		render(<Default customFields={{ department: 'Engineering' }} />, { wrapper });

		expect(screen.getByText('Engineering')).toBeInTheDocument();
	});
});
