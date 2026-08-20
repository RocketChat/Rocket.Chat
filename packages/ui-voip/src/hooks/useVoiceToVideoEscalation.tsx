import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { SessionState } from '../context';
import { useOpenVideoCall } from './useOpenVideoCall';
import { ConfirmVideoEscalationModal } from '../views';

export const useVoiceToVideoEscalation = (sessionState: SessionState) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const openVideoCall = useOpenVideoCall();
	const requestEscalation = useEndpoint('POST', '/v1/media-calls.escalate');

	const { mutateAsync: requestVideoEscalation, isPending } = useMutation({
		mutationKey: ['request-video-escalation'],
		mutationFn: requestEscalation,
	});

	const executeVideoEscalation = useCallback(async () => {
		if (sessionState.state !== 'ongoing') {
			return;
		}

		const { callId } = sessionState;

		try {
			const { url, providerName } = await requestVideoEscalation({ callId });
			openVideoCall(url, providerName);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: 'Unable_to_start_video_call' });
			console.error('Error requesting video escalation', error);
		}
	}, [sessionState, requestVideoEscalation, openVideoCall, dispatchToastMessage]);

	const onRequestVideoCall = useCallback(async () => {
		if (sessionState.escalated) {
			await executeVideoEscalation();
			return;
		}

		setModal(
			<ConfirmVideoEscalationModal
				onCancel={() => setModal(null)}
				onConfirm={async () => {
					setModal(null);
					await executeVideoEscalation();
				}}
			/>,
		);
	}, [sessionState.escalated, setModal, executeVideoEscalation]);

	return {
		isRequestingVideoCall: isPending,
		onRequestVideoCall,
	};
};
