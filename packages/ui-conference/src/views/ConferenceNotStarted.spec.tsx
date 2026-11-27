import nameToCharacterMapping from '@rocket.chat/icons';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './ConferenceNotStarted.stories.js';
import { ConferenceNotStarted } from '../index.js';

const { Default } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('ConferenceNotStarted', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { baseElement } = render(<Story />);

		// `region` off: the page is rendered on its own here; in the product the conference window is the whole page.
		// `heading-order` off: every state page puts Fuselage's `h3` state title under the page's `h1`.
		const results = await axe(baseElement, { rules: { 'region': { enabled: false }, 'heading-order': { enabled: false } } });
		expect(results).toHaveNoViolations();
	});

	// The page is told everything it shows, so it renders where nothing else is provided.
	it('renders under the bare app root, with no conference, router or endpoint available', () => {
		render(<ConferenceNotStarted title='Weekly sync' onClose={jest.fn()} />, { wrapper: mockAppRoot().build() });

		expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
	});

	it('shows the conference header, the title and the description of a conference that has not started', () => {
		render(<Default />);

		expect(screen.getByRole('heading', { name: 'Conference call' })).toBeInTheDocument();
		expect(screen.getByText('Weekly sync has not started yet')).toBeInTheDocument();
		expect(screen.getByText('You will be let in as soon as the conference starts. You can keep this page open.')).toBeInTheDocument();
	});

	it('names the link and says the page lets the user in once it starts', () => {
		render(<Default title='Design review' />);

		expect(screen.getByText('Design review has not started yet')).toBeInTheDocument();
		expect(screen.getByText(/let in as soon as the conference starts/)).toBeInTheDocument();
	});

	it('calls onClose once when Close is pressed', async () => {
		const onClick = jest.fn();
		const { unmount } = render(<Default onClose={onClick} />);

		await userEvent.click(screen.getByRole('button', { name: 'Close' }));
		expect(onClick).toHaveBeenCalledTimes(1);
		unmount();

		const onEnter = jest.fn();
		render(<Default onClose={onEnter} />);
		screen.getByRole('button', { name: 'Close' }).focus();
		await userEvent.keyboard('{Enter}');
		expect(onEnter).toHaveBeenCalledTimes(1);
	});

	// Nothing went wrong: the link simply has nothing running yet.
	it('does not draw the icon as an error', () => {
		render(<Default />);

		const icon = screen.getByText(nameToCharacterMapping.clock, { selector: 'i' });
		expect(icon).toHaveClass('rcx-states__icon');
		expect(icon).not.toHaveClass('rcx-states__icon--danger');
	});
});
