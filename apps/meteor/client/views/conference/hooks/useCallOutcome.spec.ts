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
