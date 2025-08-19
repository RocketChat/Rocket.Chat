import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type EnableE2EEModalProps = {
	onConfirm: () => void;
	onClose: () => void;
	roomType: string;
};

const EnableE2EEModal = ({ onConfirm, onClose, roomType }: EnableE2EEModalProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<GenericModal
			icon='key'
			title={t('E2E_enable_encryption')}
			variant='warning'
			confirmText={t('E2E_enable_encryption')}
			onConfirm={onConfirm}
			onCancel={onClose}
		>
			<Box mbe={16} is='p'>
				{t('E2E_enable_encryption_description', { roomType })}
			</Box>
		</GenericModal>
	);
};

export default EnableE2EEModal;
