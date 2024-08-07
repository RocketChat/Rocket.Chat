import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useCallback } from 'react';

import useVoiceCallAPI from '../../../../../hooks/voiceCall/useVoiceCallAPI';
import VoiceCallTransferModal from '../modals/TransferModal';

export const useVoiceCallTransferModal = () => {
	const setModal = useSetModal();
	const { transferCall } = useVoiceCallAPI();
	const dispatchToastMessage = useToastMessageDispatch();

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
			<VoiceCallTransferModal isLoading={handleTransfer.isLoading} onCancel={() => setModal(null)} onConfirm={handleTransfer.mutate} />,
		);
	}, [handleTransfer.isLoading, handleTransfer.mutate, setModal]);

	return { startTransfer, cancelTransfer: close };
};

export default useVoiceCallTransferModal;
