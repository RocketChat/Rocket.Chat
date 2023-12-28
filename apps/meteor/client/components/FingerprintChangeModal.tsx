import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericModal from './GenericModal';

type FingerprintChangeModalProps = {
	onConfirm: () => void;
	onCancel: () => void;
	onClose: () => void;
};

const FingerprintChangeModal = ({ onConfirm, onCancel, onClose }: FingerprintChangeModalProps): ReactElement => {
	const t = useTranslation();
	return (
		<GenericModal
			variant='warning'
			title={t('Unique_ID_change_detected')}
			onConfirm={onConfirm}
			onClose={onClose}
			onCancel={onCancel}
			confirmText={t('New_workspace')}
			cancelText={t('Configuration_update')}
		>
			<Box
				is='p'
				mbe={16}
				dangerouslySetInnerHTML={{
					__html: t('Unique_ID_change_detected_description'),
				}}
			/>
			<Box
				is='p'
				mbe={16}
				dangerouslySetInnerHTML={{
					__html: t('Unique_ID_change_detected_learn_more_link'),
				}}
			/>
		</GenericModal>
	);
};

export default FingerprintChangeModal;
