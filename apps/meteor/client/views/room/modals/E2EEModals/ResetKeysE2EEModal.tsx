import { Box, ModalFooterAnnotation, ModalIcon } from '@rocket.chat/fuselage';
import { ExternalLink, GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useE2EEResetRoomKey } from '../../hooks/useE2EEResetRoomKey';

const E2EE_RESET_KEY_LINK = 'https://go.rocket.chat/i/e2ee-guide';

type ResetKeysE2EEModalProps = {
	roomType: string;
	roomId: string;
	onCancel: () => void;
};

const ResetKeysE2EEModal = ({ roomType, roomId, onCancel }: ResetKeysE2EEModalProps): ReactElement => {
	const { t } = useTranslation();
	const resetRoomKeyMutation = useE2EEResetRoomKey();

	const dispatchToastMessage = useToastMessageDispatch();

	const handleResetRoomKey = () => {
		resetRoomKeyMutation.mutate(
			{ roomId },
			{
				onSuccess: () => {
					dispatchToastMessage({ type: 'success', message: t('E2E_reset_encryption_keys_success') });
				},
				onError: () => {
					dispatchToastMessage({ type: 'error', message: t('E2E_reset_encryption_keys_error') });
				},
				onSettled: () => {
					onCancel();
				},
			},
		);
	};

	return (
		<GenericModal
			icon={<ModalIcon color='danger' name='key' />}
			title={t('E2E_reset_encryption_keys')}
			variant='danger'
			confirmText={t('E2E_reset_encryption_keys')}
			dontAskAgain={<ModalFooterAnnotation>{t('This_action_cannot_be_undone')}</ModalFooterAnnotation>}
			onCancel={onCancel}
			onConfirm={handleResetRoomKey}
			onDismiss={() => undefined}
		>
			<Box mbe={16} is='p'>
				<Trans i18nKey='E2E_reset_encryption_keys_modal_description' tOptions={{ roomType }}>
					Resetting E2EE keys is only recommend if no {roomType} member has a valid key to regain access to the previously encrypted
					content. All members may lose access to previously encrypted content.
					<ExternalLink to={E2EE_RESET_KEY_LINK}>Learn more</ExternalLink> about resetting encryption keys. Proceed with caution.
				</Trans>
			</Box>
		</GenericModal>
	);
};

export default ResetKeysE2EEModal;
