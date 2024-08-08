import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useCallback } from 'react';

import type { VoiceCallOngoingSession } from '../../../../../contexts/VoiceCallContext';
import useVoiceCallAPI from '../../../../../hooks/voiceCall/useVoiceCallAPI';
import VoiceCallTransferModal from '../modals/TransferModal';

type UseVoiceCallTransferParams = {
	session: VoiceCallOngoingSession;
};

export const useVoiceCallTransferModal = ({ session }: UseVoiceCallTransferParams) => {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { transferCall } = useVoiceCallAPI();

	const close = useCallback(() => setModal(null), [setModal]);

	const handleTransfer = useMutation({
		mutationFn: async (username: string) => {
			await transferCall(username);
			return username;
		},
		onSuccess: (username: string) => {
			dispatchToastMessage({ type: 'success', message: t('Call_transfered_to', { username }) });
			close();
		},
		onError: () => {
			dispatchToastMessage({ type: 'error', message: t('Failed_to_transfer_call') });
			close();
		},
	});

	const startTransfer = useCallback(() => {
		setModal(
			<VoiceCallTransferModal
				session={session}
				isLoading={handleTransfer.isLoading}
				onCancel={() => setModal(null)}
				onConfirm={handleTransfer.mutate}
			/>,
		);
	}, [handleTransfer.isLoading, handleTransfer.mutate, session, setModal]);

	return { startTransfer, cancelTransfer: close };
};

export default useVoiceCallTransferModal;
