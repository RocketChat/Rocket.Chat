import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import VoipContactId from './VoipContactId';
import * as stories from './VoipContactId.stories';

const testCases = Object.values(composeStories(stories)).map((story) => [story.storyName || 'Story', story]);

beforeAll(() => {
	Object.assign(navigator, {
		clipboard: {
			writeText: jest.fn(),
		},
	});
});

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const tree = render(<Story />, { wrapper: mockAppRoot().build() });
	expect(tree.baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('should display avatar and name when username is available', () => {
	render(<VoipContactId name='John Doe' username='john.doe' />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute('title', 'john.doe');
	expect(screen.getByText('John Doe')).toBeInTheDocument();
});

it('should display transferedBy information when available', () => {
	render(<VoipContactId name='John Doe' username='john.doe' transferedBy='Jane Doe' />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.getByText('From: Jane Doe')).toBeInTheDocument();
});

it('should display copy button when username isnt available', async () => {
	const phone = faker.phone.number();
	render(<VoipContactId name={phone} />, {
		wrapper: mockAppRoot().build(),
	});

	const copyButton = screen.getByRole('button', { name: 'Copy_phone_number' });
	expect(copyButton).toBeInTheDocument();

	await userEvent.click(copyButton);
	await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(phone));
});
