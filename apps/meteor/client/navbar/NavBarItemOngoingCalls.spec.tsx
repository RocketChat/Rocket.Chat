import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './NavBarItemOngoingCalls.stories';

/**
 * Whether the button is there at all and what colour it is — red while something rings, blue while something
 * merely runs — is what the stories show, and the snapshots are what hold it. Asserting a Fuselage class name
 * for that only pinned the class name.
 *
 * What is left here is what the button does: opening the list, opening itself when a call starts ringing, and
 * giving the calls somewhere to be found.
 */
const { OneOngoing, Ringing, SeveralOngoing } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

/**
 * The list is fetched, so the first frames are empty whatever the story holds — and a story with nothing to
 * show stays empty, so there is no one element to wait for. Waiting for two consecutive frames to agree is what
 * covers both: a fixed flush raced the query and snapshotted an empty box for the largest story.
 */
const settled = async (element: HTMLElement) => {
	let previous: string | undefined;

	await waitFor(() => {
		const html = element.innerHTML;
		const unchanged = html === previous;
		previous = html;

		expect(unchanged).toBe(true);
	});
};

describe('NavBarItemOngoingCalls', () => {
	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);
		await settled(baseElement);

		expect(baseElement).toMatchSnapshot();
	});

	// Settled first, for the same reason the snapshots are: the list is fetched, so an unsettled render is an
	// empty box — and an empty box has no violations to find. What these stories are here to check is the button,
	// its badge and the open dropdown.
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container, baseElement } = render(<Story />);
		await settled(baseElement);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('opens the list on click', async () => {
		render(<OneOngoing />);

		await userEvent.click(await screen.findByRole('button', { name: /ongoing call/i }));

		expect(await screen.findByText('Daily standup')).toBeInTheDocument();
	});

	// A ring is not something to go looking for.
	it('opens itself when something is ringing, without being asked', async () => {
		render(<Ringing />);

		expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
	});

	// The list opened into a bare box, so the calls in it were loose rows nothing could scope to.
	it('opens a named region holding the calls', async () => {
		render(<SeveralOngoing />);

		await userEvent.click(await screen.findByRole('button', { name: /ongoing call/i }));

		const list = await screen.findByRole('region', { name: 'Ongoing calls' });

		await waitFor(() => expect(list).toHaveTextContent('Daily standup'));
	});
});
