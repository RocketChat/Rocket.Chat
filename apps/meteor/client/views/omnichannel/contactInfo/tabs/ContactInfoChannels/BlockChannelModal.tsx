import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../../components/GenericModal';

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
