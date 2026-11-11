import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { SwitchCallModal } from '@rocket.chat/ui-conference';
import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';
import { useCallback, useRef } from 'react';

/**
 * Joins a call, asking first when it means leaving the one the user is already in.
 *
 * Only the asking is here. What the question looks like, how it waits and what it says when the answer fails is
 * `SwitchCallModal`'s — a modal that has to stay on screen while the server answers cannot be a node built in a
 * callback, because it has state.
 *
 * @param calls the joinable calls, to find the one being left in. Taken rather than fetched: the only caller
 * already holds the list, and asking for it again here subscribed a second time to the same stream.
 */
export const useJoinOrSwitchCallModal = (calls: JoinableVideoConference[]) => {
	const setModal = useSetModal();
	const joinCall = useVideoConfJoinCall();
	const leaveCall = useEndpoint('POST', '/v1/video-conference.leave');

	// One switch at a time. The list behind the confirmation is still there, and picking a second call while the
	// first leave was in flight started a second leave-and-join — two joins racing, either of which could win.
	const switching = useRef(false);

	return useCallback(
		(callId: string) => {
			if (switching.current) {
				return;
			}

			const current = calls.find((call) => call.joined && call.callId !== callId);

			if (!current) {
				joinCall(callId);
				return;
			}

			const leaveAndJoin = async () => {
				switching.current = true;

				try {
					// Leave first: joining is what tears down the old call's page, and by then it can no longer report
					// its own departure. So a leave that failed is not something to join past — the old call would keep
					// counting this user as present, with nothing left to correct it. The rejection is the modal's to
					// show.
					await leaveCall({ callId: current.callId });

					setModal(null);
					joinCall(callId);
				} finally {
					// Including on failure: the modal stays open saying so, and the user may try again.
					switching.current = false;
				}
			};

			setModal(<SwitchCallModal leaving={current} onConfirm={leaveAndJoin} onCancel={() => setModal(null)} />);
		},
		[calls, joinCall, leaveCall, setModal],
	);
};
