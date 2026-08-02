import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import type { ConferenceMember } from './useCallOutcome';
import { useCallOutcome } from './useCallOutcome';

const me = 'john.doe';

const member = (overrides: Partial<ConferenceMember> & Pick<ConferenceMember, '_id'>): ConferenceMember => ({
	username: `${overrides._id}.user`,
	name: overrides._id,
	...overrides,
});

const render = (members: ConferenceMember[]) => renderHook(() => useCallOutcome(members), { wrapper: mockAppRoot().withJohnDoe().build() });

const waitOutTheRing = () => act(() => void jest.advanceTimersByTime(60_000));

/** A ring the user asked for is one-shot, so its wait is much shorter than the first attempt's. */
const waitOutARering = () => act(() => void jest.advanceTimersByTime(16_000));

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

it('reports nothing while the other side may still pick up', () => {
	const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: false })]);

	expect(result.current.outcome).toBeUndefined();
});

it('reports nobody answered once the ring has had its chance', () => {
	const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: false })]);

	waitOutTheRing();

	expect(result.current.outcome).toBe('unanswered');
});

// A decline is an answer, so there is no reason to keep waiting for the ring window to run out.
it('reports a decline immediately, without waiting', () => {
	const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: false, declined: true })]);

	expect(result.current.outcome).toBe('declined');
});

it('reports nothing once someone else is in the call', () => {
	const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: true })]);

	waitOutTheRing();

	expect(result.current.outcome).toBeUndefined();
});

// A member who joined and left is not present, but they did answer — treating that as "nobody answered" would
// tell the user something untrue about a call that happened.
it('reports nobody answered rather than a decline when the other side joined and left', () => {
	const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: true, leftAt: new Date() })]);

	waitOutTheRing();

	expect(result.current.outcome).toBe('unanswered');
});

// A conference started in a channel rings nobody in particular, so silence there is not an outcome to report.
it('reports nothing when there is nobody else to wait for', () => {
	const { result } = render([member({ _id: me, joined: true })]);

	waitOutTheRing();

	expect(result.current.outcome).toBeUndefined();
});

it('stays quiet after the user chooses to stay', () => {
	const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: false })]);

	waitOutTheRing();
	act(() => result.current.onDismiss());

	expect(result.current.outcome).toBeUndefined();
});

// Ringing again restarts the wait, so a dismissal of the previous attempt must not silence its outcome too.
it('reports again when a fresh ring also goes unanswered', () => {
	const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: false })]);

	waitOutTheRing();
	act(() => result.current.onDismiss());
	act(() => result.current.onRang());

	expect(result.current.outcome).toBeUndefined();

	waitOutTheRing();

	expect(result.current.outcome).toBe('unanswered');
});

describe('ringing again', () => {
	const declinedAt = new Date('2026-08-02T10:00:00.000Z');

	it('takes the modal down straight away', () => {
		const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: false, declined: true, declinedAt })]);

		expect(result.current.outcome).toBe('declined');

		act(() => result.current.onRang());

		expect(result.current.outcome).toBeUndefined();
	});

	// `declined` never goes back to false, so treating it as current would put the modal back up the instant the
	// user rang again — reporting a decline they haven't made yet.
	it('does not report the previous decline again while waiting on the new ring', () => {
		const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: false, declined: true, declinedAt })]);

		act(() => result.current.onRang());
		act(() => void jest.advanceTimersByTime(5_000));

		expect(result.current.outcome).toBeUndefined();
	});

	it('reports a decline again once they decline the new ring', () => {
		const callee = member({ _id: 'callee', joined: false, declined: true, declinedAt });
		const { result, rerender } = renderHook((props: ConferenceMember[]) => useCallOutcome(props), {
			initialProps: [member({ _id: me, joined: true }), callee],
			wrapper: mockAppRoot().withJohnDoe().build(),
		});

		act(() => result.current.onRang());
		expect(result.current.outcome).toBeUndefined();

		rerender([member({ _id: me, joined: true }), { ...callee, declinedAt: new Date('2026-08-02T10:05:00.000Z') }]);

		expect(result.current.outcome).toBe('declined');
	});

	// The re-ring stops on its own after a few seconds, so ignoring it has to surface as unanswered rather than
	// leaving the caller with a call that quietly stopped ringing.
	it('reports unanswered when the new ring is ignored', () => {
		const { result } = render([member({ _id: me, joined: true }), member({ _id: 'callee', joined: false })]);

		waitOutTheRing();
		act(() => result.current.onRang());

		expect(result.current.outcome).toBeUndefined();

		waitOutARering();

		expect(result.current.outcome).toBe('unanswered');
	});
});
