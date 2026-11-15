import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './OngoingCallsDropdown.stories';

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
 * A fixed now, set to the day the fixtures say their calls started.
 *
 * Without it these rows render the *date* a call began, because that date is in the past — and the string moves
 * on as the calendar does, so a snapshot of it goes stale on its own. Frozen alongside the fixture, the row says
 * the time the call started, which is what it says for a call running now.
 *
 * Only `Date` is faked; timers stay real, so the interactions below behave as in a browser.
 */
beforeEach(() => {
	jest.useFakeTimers({
		doNotFake: [
			'setTimeout',
			'clearTimeout',
			'setInterval',
			'clearInterval',
			'setImmediate',
			'clearImmediate',
			'nextTick',
			'queueMicrotask',
			'requestAnimationFrame',
			'cancelAnimationFrame',
			'requestIdleCallback',
			'cancelIdleCallback',
			'performance',
		],
	});
	jest.setSystemTime(new Date('2026-08-03T10:00:00.000Z'));
});

afterEach(() => {
	jest.useRealTimers();
});

describe('OngoingCallsDropdown', () => {
	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);

		expect(baseElement).toMatchSnapshot();
	});

	// Audited from `baseElement` and not from `container`: the dropdown is portalled to the body, so a run over
	// the render container covered the button and nothing the button opens — including the story that opens the
	// list on its own.
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { baseElement } = render(<Story />);

		// `region` off: it asks that every piece of page content sit inside a landmark, and the page here is one
		// navbar item rendered on its own — in the product this sits inside the navigation bar's own landmark.
		const results = await axe(baseElement, { rules: { region: { enabled: false } } });
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

	// The list opened into a bare box of links, so the calls in it were loose rows nothing could count or scope
	// to. It is a list now, named, with each call an item of it.
	it('opens a named list holding the calls', async () => {
		render(<SeveralOngoing />);

		await userEvent.click(await screen.findByRole('button', { name: /ongoing call/i }));

		const list = await screen.findByRole('list', { name: 'Ongoing calls' });

		await waitFor(() => expect(list).toHaveTextContent('Daily standup'));
	});

	// The list is portalled away from the button, so nothing follows a keyboard reader there on its own.
	it('says whether the list is open, and takes focus into it', async () => {
		render(<OneOngoing />);

		const button = await screen.findByRole('button', { name: /ongoing call/i });
		expect(button).toHaveAttribute('aria-expanded', 'false');

		await userEvent.click(button);

		expect(button).toHaveAttribute('aria-expanded', 'true');
		await waitFor(() =>
			expect(screen.getByRole('list', { name: 'Ongoing calls' })).toContainElement(document.activeElement as HTMLElement),
		);
	});

	// Escape is how a thing opened over the page is dismissed, and the button it came from is where focus belongs.
	it('closes on Escape and gives the button its focus back', async () => {
		render(<OneOngoing />);

		const button = await screen.findByRole('button', { name: /ongoing call/i });
		await userEvent.click(button);
		await screen.findByRole('list', { name: 'Ongoing calls' });

		await userEvent.keyboard('{Escape}');

		await waitFor(() => expect(screen.queryByRole('list', { name: 'Ongoing calls' })).not.toBeInTheDocument());
		expect(button).toHaveFocus();
	});
});
