import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import VoipTransferModal from '../components/VoipTransferModal';
import type { VoipOngoingSession } from '../definitions';
import { useVoipAPI } from './useVoipAPI';

type UseVoipTransferParams = {
	session: VoipOngoingSession;
};

export const useVoipTransferModal = ({ session }: UseVoipTransferParams) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { transferCall } = useVoipAPI();

	const close = useCallback(() => setModal(null), [setModal]);

	useEffect(() => () => close(), [close]);

	const handleTransfer = useMutation({
		mutationFn: async ({ extension, name }: { extension: string; name: string | undefined }) => {
			await transferCall(extension);
			return name || extension;
		},
		onSuccess: (name: string) => {
			dispatchToastMessage({ type: 'success', message: t('Call_transfered_to__name__', { name }) });
			close();
		},
		onError: () => {
			dispatchToastMessage({ type: 'error', message: t('Failed_to_transfer_call') });
			close();
		},
	});

	const startTransfer = useCallback(() => {
		setModal(
			<VoipTransferModal
				extension={session.contact.id}
				isLoading={handleTransfer.isPending}
				onCancel={() => setModal(null)}
				onConfirm={handleTransfer.mutate}
			/>,
		);
	}, [handleTransfer.isPending, handleTransfer.mutate, session, setModal]);

	return { startTransfer, cancelTransfer: close };
};
