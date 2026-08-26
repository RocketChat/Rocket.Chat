import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useJoinableCalls } from './useJoinableCalls';

/**
 * Joins a call, leaving the one the user is already in.
 *
 * A user is in one call at a time. The call window is shared, so joining a second call already replaces the first
 * one's page — but that is not the same as leaving it: without an explicit leave its participant stays counted as
 * present, which keeps the abandoned call listed as occupied and stops it ever emptying out.
 *
 * And it asks first. Swapping the call someone is in the middle of, because they clicked a name in a list, is not
 * something to do quietly — the confirmation names the call being left.
 */
export const useJoinCall = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const joinCall = useVideoConfJoinCall();
	const leaveCall = useEndpoint('POST', '/v1/video-conference.leave');
	const dispatchToastMessage = useToastMessageDispatch();
	const { calls } = useJoinableCalls();

	return useCallback(
		(callId: string) => {
			const current = calls.find((call) => call.joined && call.callId !== callId);

			if (!current) {
				joinCall(callId);
				return;
			}

			const leaveAndJoin = async () => {
				setModal(null);
				// Leave first: joining is what tears down the old call's page, and by then it can no longer report
				// its own departure. So a leave that failed is not something to join past — the old call would keep
				// counting this user as present, with nothing left to correct it. Say so and stay where we are.
				try {
					await leaveCall({ callId: current.callId });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
					return;
				}
				joinCall(callId);
			};

			setModal(
				<GenericModal
					variant='warning'
					icon={null}
					title={t('Leave_the_call_you_are_in')}
					confirmText={t('Join')}
					onConfirm={leaveAndJoin}
					onCancel={() => setModal(null)}
				>
					{/* The call being left is the whole point of asking, so its name is emphasised rather than buried in the
					sentence — which needs `Trans`, since `t` would put the markup on screen as text. */}
					<Trans
						i18nKey='Leave__name__to_join_this_call'
						values={{ name: current.name }}
						components={{ b: <Box is='span' fontWeight={600} color='default' /> }}
					/>
				</GenericModal>,
			);
		},
		[calls, dispatchToastMessage, joinCall, leaveCall, setModal, t],
	);
};
