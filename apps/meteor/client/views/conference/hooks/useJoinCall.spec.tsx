import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useJoinCall } from './useJoinCall';
import { useJoinableCalls } from './useJoinableCalls';
import { buildJoinableCall as call } from '../testFixtures';

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
	const { result } = renderHook(() => ({ join: useJoinCall(), loaded: useJoinableCalls().calls.length }), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			// The joinable list is only asked for where the call window is, so without the setting this hook has
			// nothing to decide from.
			.withSetting('VideoConf_Conference_Window_Enabled', true)
			// Naming the call being left is the point of the confirmation, and the name only reaches the screen
			// through this string's interpolation — the untranslated key would carry no name at all.
			.withTranslations('en', 'core', {
				Leave__name__to_join_this_call: 'You are in <b>{{name}}</b>. Joining this call will leave it.',
			})
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.leave', leave)
			.build(),
	});

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
		const join = await renderJoin(calls);

		await join('wanted');

		await userEvent.click(await screen.findByRole('button', { name: 'Join' }));

		await waitFor(() => expect(leave).toHaveBeenCalledWith({ callId: 'current' }));
		await waitFor(() => expect(joinCall).toHaveBeenCalledWith('wanted'));
	});

	it('does nothing at all if the user changes their mind', async () => {
		const join = await renderJoin(calls);

		await join('wanted');

		await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

		expect(leave).not.toHaveBeenCalled();
		expect(joinCall).not.toHaveBeenCalled();
	});

	// Clicking the call they are already in shouldn't offer to leave it in order to rejoin it.
	it('does not ask when the call being joined is the one they are in', async () => {
		const join = await renderJoin(calls);

		await join('current');

		expect(joinCall).toHaveBeenCalledWith('current');
		expect(leave).not.toHaveBeenCalled();
	});
});
