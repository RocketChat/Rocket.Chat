import React, { FC } from 'react';

import GenericModal from '../../components/GenericModal';
import { useTranslation } from '../../contexts/TranslationContext';

type ConvertToChannelModalProps = {
	onClose: () => void;
	onConfirm: () => void;
};

const ConvertToChannelModal: FC<ConvertToChannelModalProps> = ({ onClose, onConfirm }) => {
	const t = useTranslation();

	return (
		<GenericModal
			title={t('Confirmation')}
			variant='warning'
			onClose={onClose}
			onCancel={onClose}
			onConfirm={onConfirm}
			confirmText={t('Convert')}
		>
			{t('Converting_channel_to_a_team')}
		</GenericModal>
	);
};

export default ConvertToChannelModal;
