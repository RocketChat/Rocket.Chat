import type { IPasskey } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useEndpointMutation } from '../../../hooks/useEndpointMutation';
import { isTwoFactorCancelledError } from '../../../lib/2fa/utils';
import { passkeysQueryKeys } from '../../../lib/queryKeys';

export const useRemovePasskey = ({ onRemoved }: { onRemoved?: () => void } = {}) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const { mutate: deletePasskey } = useEndpointMutation('POST', '/v1/passkeys.delete', {
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: passkeysQueryKeys.all });
			dispatchToastMessage({ type: 'success', message: t('Passkey_removed') });
			onRemoved?.();
		},
		onError: (error) => {
			if (!isTwoFactorCancelledError(error)) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
	});

	return ({ _id, name }: Pick<IPasskey, '_id' | 'name'>) =>
		setModal(
			<GenericModal
				variant='danger'
				title={t('Remove_passkey')}
				confirmText={t('Remove')}
				onConfirm={() => {
					setModal(null);
					deletePasskey({ passkeyId: _id });
				}}
				onCancel={() => setModal(null)}
			>
				{t('Remove_passkey_confirmation', { name })}
			</GenericModal>,
		);
};
