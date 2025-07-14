import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type BlockChannelModalProps = {
	onCancel: () => void;
	onConfirm: () => void;
};

const BlockChannelModal = ({ onCancel, onConfirm }: BlockChannelModalProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal variant='danger' icon='ban' title={t('Block_channel')} confirmText={t('Block')} onConfirm={onConfirm} onCancel={onCancel}>
			<Box>{t('Block_channel_description')}</Box>
		</GenericModal>
	);
};

export default BlockChannelModal;
