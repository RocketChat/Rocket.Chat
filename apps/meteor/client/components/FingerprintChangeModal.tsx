import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from './GenericModal';

type FingerprintChangeModalProps = {
	onConfirm: () => void;
	onCancel: () => void;
	onClose: () => void;
};

const FingerprintChangeModal = ({ onConfirm, onCancel, onClose }: FingerprintChangeModalProps): ReactElement => {
	const { t } = useTranslation();
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
					__html: DOMPurify.sanitize(t('Unique_ID_change_detected_description')),
				}}
			/>
			<Box
				is='p'
				mbe={16}
				dangerouslySetInnerHTML={{
					__html: DOMPurify.sanitize(t('Unique_ID_change_detected_learn_more_link'), {
						ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
						ALLOWED_ATTR: ['href', 'title'],
					}),
				}}
			/>
		</GenericModal>
	);
};

export default FingerprintChangeModal;
