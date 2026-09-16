import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';
import { useCallback } from 'react';

import { useJoinableCalls } from './useJoinableCalls';
import SwitchCallModal from '../components/SwitchCallModal';

/**
 * Joins a call, asking first when it means leaving the one the user is already in.
 *
 * Only the asking is here. What the question looks like, how it waits and what it says when the answer fails is
 * `SwitchCallModal`'s — a modal that has to stay on screen while the server answers cannot be a node built in a
 * callback, because it has state.
 */
export const useJoinOrSwitchCallModal = () => {
	const setModal = useSetModal();
	const joinCall = useVideoConfJoinCall();
	const leaveCall = useEndpoint('POST', '/v1/video-conference.leave');
	const { calls } = useJoinableCalls();

	return useCallback(
		(callId: string) => {
			const current = calls.find((call) => call.joined && call.callId !== callId);

			if (!current) {
				joinCall(callId);
				return;
			}

			const leaveAndJoin = async () => {
				// Leave first: joining is what tears down the old call's page, and by then it can no longer report its
				// own departure. So a leave that failed is not something to join past — the old call would keep counting
				// this user as present, with nothing left to correct it. The rejection is the modal's to show.
				await leaveCall({ callId: current.callId });

				setModal(null);
				joinCall(callId);
			};

			setModal(<SwitchCallModal leaving={current} onConfirm={leaveAndJoin} onCancel={() => setModal(null)} />);
		},
		[calls, joinCall, leaveCall, setModal],
	);
};
