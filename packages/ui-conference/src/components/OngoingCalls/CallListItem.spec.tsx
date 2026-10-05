import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';

import CallListItem from './CallListItem';
import * as stories from './CallListItem.stories';
import { OngoingCallsContext } from '../../context/OngoingCallsContext';
import { buildOngoingCallsContext } from '../../fixtures/storyFixtures';
import { buildJoinableCall } from '../../fixtures/testFixtures';

/**
 * What the row looks like in each state — ringing, silenced, declined, already joined — is the stories' job, and
 * the snapshots are what hold it. What is left here is what the row *does* when it is used, which a picture
 * cannot say.
 *
 * What it does, it asks the list for: joining, declining and silencing are all the surrounding context's, so the
 * spies go in there rather than in props.
 */
const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

const joinCall = jest.fn();
const declineCall = jest.fn();
const silenceCall = jest.fn();

const standup = buildJoinableCall({ callId: 'standup', name: 'Daily standup', usersCount: 4 });
const ringing = buildJoinableCall({ callId: 'ringing', name: 'Ada Lovelace', ringingAt: new Date(), usersCount: 1 });

const renderRow = (call = standup, { silencedCalls = [] as string[], audible = true } = {}) => {
	const AppRoot = mockAppRoot().withJohnDoe().build();

	const calls = buildOngoingCallsContext({
		joinCall,
		declineCall,
		silenceCall,
		silencedCalls,
		audibleCalls: audible ? [call.callId] : [],
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<OngoingCallsContext.Provider value={calls}>{children}</OngoingCallsContext.Provider>
		</AppRoot>
	);

	return render(<CallListItem call={call} />, { wrapper });
};

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

beforeEach(() => {
	joinCall.mockClear();
	declineCall.mockClear();
	silenceCall.mockClear();
});

describe('CallListItem', () => {
	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);

		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	// Answering or rejoining is what the row is for, so the whole row is the way in — and it is a link, which is
	// what gives it a name and a place in the tab order. Clicking it must not follow the href: the call window
	// opens through the callback.
	it('opens the call when the row is clicked, without following the link', async () => {
		renderRow();

		// Dispatched rather than clicked through `userEvent`, which reports nothing about the default action: the
		// row has a real `href`, and a regression that opened the call *and* navigated would pass a test that only
		// checked the callback.
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		fireEvent(screen.getByRole('link', { name: /Daily standup/ }), event);

		expect(joinCall).toHaveBeenCalledWith('standup');
		expect(declineCall).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(true);
	});

	it('turns the call down without opening it', async () => {
		renderRow();

		await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

		expect(declineCall).toHaveBeenCalledWith('standup');
		expect(joinCall).not.toHaveBeenCalled();
	});

	// Silencing is neither answering nor refusing: it stops this client's noise and leaves the call where it was.
	it('silences a ring without answering or declining it', async () => {
		renderRow(ringing);

		await userEvent.click(screen.getByRole('button', { name: 'Silence' }));

		expect(silenceCall).toHaveBeenCalledWith('ringing');
		expect(joinCall).not.toHaveBeenCalled();
		expect(declineCall).not.toHaveBeenCalled();
	});

	it('still declines once the ring is silenced', async () => {
		renderRow(ringing, { silencedCalls: ['ringing'] });

		await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

		expect(declineCall).toHaveBeenCalledWith('ringing');
	});
});
