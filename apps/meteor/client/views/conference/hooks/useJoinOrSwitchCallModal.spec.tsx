import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { buildJoinableCall as call } from '@rocket.chat/ui-conference';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useJoinOrSwitchCallModal } from './useJoinOrSwitchCallModal';
import { useJoinableCalls } from './useJoinableCalls';

const joinCall = jest.fn();

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfJoinCall: () => joinCall,
}));

const leave = jest.fn(() => ({ success: true }) as any);

/**
 * The hook decides from the joinable list, so a test that fires before that list arrives proves nothing — it
 * would take the "no other call" path every time. This waits for the data, then hands back the join function.
 */
const renderJoin = async (calls: JoinableVideoConference[]) => {
	const { result } = renderHook(
		() => {
			// Through `useJoinableCalls` rather than handed the fixture directly: what the hook is given is what a
			// caller reads from there, timestamps revived and all.
			const { calls: loaded } = useJoinableCalls();

			return { join: useJoinOrSwitchCallModal(loaded), loaded: loaded.length };
		},
		{
			wrapper: mockAppRoot()
				.withJohnDoe()
				// The joinable list is gated on the window, and without it the query never runs — so every case here
				// would take the "no other call" path whatever the fixture says.
				.withSetting('VideoConf_Conference_Window_Enabled', true)
				// Naming the call being left is the point of the confirmation, and the name only reaches the screen
				// through this string's interpolation — the untranslated key would carry no name at all.
				.withTranslations('en', 'core', {
					Leave__name__to_join_this_call: 'You are in <b>{{name}}</b>. Joining this call will leave it.',
					Could_not_leave_the_call_you_are_in: 'Could not leave the call you are in. Please try again.',
				})
				.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
				.withEndpoint('POST', '/v1/video-conference.leave', leave)
				.build(),
		},
	);

	await waitFor(() => expect(result.current.loaded).toBe(calls.length));

	return (callId: string) => act(() => result.current.join(callId));
};

beforeEach(() => {
	joinCall.mockClear();
	leave.mockClear();
});

it('joins straight away when the user is in no other call', async () => {
	const join = await renderJoin([call({ callId: 'wanted' })]);

	await join('wanted');

	expect(joinCall).toHaveBeenCalledWith('wanted');
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

// Swapping the call someone is in the middle of, because they clicked a name in a list, is not something to do
// quietly — and the confirmation has to name the call they would be leaving.
describe('when the user is already in another call', () => {
	const calls = [call({ callId: 'current', name: 'Standup', joined: true }), call({ callId: 'wanted' })];

	it('asks first, naming the call it would leave', async () => {
		const join = await renderJoin(calls);

		await join('wanted');

		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(screen.getByText('Leave_the_call_you_are_in')).toBeInTheDocument();
		// The call being left, by name: a dialog that only says "leave the call you are in" leaves the user to
		// guess which one, and a broken `Trans` body would drop the name without failing anything else.
		expect(screen.getByText('Standup')).toBeInTheDocument();
		expect(joinCall).not.toHaveBeenCalled();
	});

	// The shared window replacing the old call's page is not the same as leaving it: without this the abandoned
	// call keeps counting its participant, so it stays listed as occupied and never empties.
	it('leaves the current call before joining the new one', async () => {
		// The leave is held open, because "both eventually happened" is true of the order this exists to prevent
		// as well. What is asserted is that nothing joins while the leave is still out.
		let answerLeave: () => void = () => undefined;
		leave.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					answerLeave = () => resolve({ success: true } as any);
				}) as any,
		);

		const join = await renderJoin(calls);

		await join('wanted');

		await userEvent.click(await screen.findByRole('button', { name: 'Join' }));

		await waitFor(() => expect(leave).toHaveBeenCalledWith({ callId: 'current' }));
		expect(joinCall).not.toHaveBeenCalled();

		await act(async () => {
			answerLeave();
		});

		await waitFor(() => expect(joinCall).toHaveBeenCalledWith('wanted'));
	});

	it('does nothing at all if the user changes their mind', async () => {
		const join = await renderJoin(calls);

		await join('wanted');

		await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

		expect(leave).not.toHaveBeenCalled();
		expect(joinCall).not.toHaveBeenCalled();
	});

	// The whole reason the leave goes first: joining tears the old call's page down, and by then it can no longer
	// report its own departure. A leave that failed is not something to join past.
	it('stays put, and says so where it was asked, when the leave fails', async () => {
		leave.mockRejectedValueOnce(new Error('nope'));

		const join = await renderJoin([call({ callId: 'current', joined: true, name: 'Daily standup' }), call({ callId: 'wanted' })]);

		await join('wanted');
		await userEvent.click(screen.getByRole('button', { name: 'Join' }));

		// Next to the button that caused it, not in a toast on a screen the modal would have left: the modal is
		// still open, and the failure is inside it.
		expect(await screen.findByRole('alert')).toHaveTextContent('Could not leave the call you are in');
		expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
		expect(joinCall).not.toHaveBeenCalled();
	});

	// A leave on its way cannot be called back, so the confirmation stops being dismissable until it comes back:
	// closing it would hide a failure the user has to see, or leave the join arriving on a screen that has gone.
	it('cannot be dismissed while it is still leaving', async () => {
		let answerLeave: () => void = () => undefined;
		leave.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					answerLeave = () => resolve({ success: true } as any);
				}) as any,
		);

		const join = await renderJoin(calls);

		await join('wanted');
		await userEvent.click(await screen.findByRole('button', { name: 'Join' }));

		await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled());

		await userEvent.keyboard('{Escape}');
		expect(screen.getByRole('dialog')).toBeInTheDocument();

		await act(async () => {
			answerLeave();
		});

		await waitFor(() => expect(joinCall).toHaveBeenCalledWith('wanted'));
	});

	// The list the choice was made from is still there behind the confirmation, so a second call can be picked
	// while the first leave is in flight — and two leave-and-joins running at once are two joins racing, either of
	// which can win.
	it('ignores a second choice while it is still leaving', async () => {
		let answerLeave: () => void = () => undefined;
		leave.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					answerLeave = () => resolve({ success: true } as any);
				}) as any,
		);

		const join = await renderJoin([
			call({ callId: 'current', name: 'Standup', joined: true }),
			call({ callId: 'wanted' }),
			call({ callId: 'other' }),
		]);

		await join('wanted');
		await userEvent.click(await screen.findByRole('button', { name: 'Join' }));

		await waitFor(() => expect(leave).toHaveBeenCalledTimes(1));

		await join('other');
		expect(leave).toHaveBeenCalledTimes(1);

		await act(async () => {
			answerLeave();
		});

		await waitFor(() => expect(joinCall).toHaveBeenCalledTimes(1));
		expect(joinCall).toHaveBeenCalledWith('wanted');
	});

	// Clicking the call they are already in shouldn't offer to leave it in order to rejoin it.
	it('does not ask when the call being joined is the one they are in', async () => {
		const join = await renderJoin(calls);

		await join('current');

		expect(joinCall).toHaveBeenCalledWith('current');
		expect(leave).not.toHaveBeenCalled();
	});
});
