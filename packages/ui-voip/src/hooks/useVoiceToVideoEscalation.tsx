import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import type { SessionState } from '../context';
import { useOpenVideoCall } from './useOpenVideoCall';
import { ConfirmVideoEscalationModal } from '../views';

export const useVoiceToVideoEscalation = (sessionState: SessionState) => {
	const setModal = useSetModal();
	const openVideoCall = useOpenVideoCall();
	const requestEscalation = useEndpoint('POST', '/v1/media-calls.escalate');

	const { mutateAsync: requestVideoEscalation, isPending } = useMutation({
		mutationKey: ['request-video-escalation'],
		mutationFn: requestEscalation,
	});

	const executeVideoEscalation = async () => {
		if (sessionState.state !== 'ongoing') {
			return;
		}

		const { callId } = sessionState;

		try {
			const { url, providerName } = await requestVideoEscalation({ callId });
			openVideoCall(url, providerName);
		} catch (error) {
			console.error('Error requesting video escalation', error);
		}
	};

	const onRequestVideoCall = async () => {
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
	};

	return {
		isRequestingVideoCall: isPending,
		onRequestVideoCall,
	};
};
