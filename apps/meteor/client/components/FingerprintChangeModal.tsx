import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { links } from '../lib/links';

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
			confirmText={t('Configuration_update')}
			cancelText={t('New_workspace')}
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
					__html: DOMPurify.sanitize(
						t('Unique_ID_change_detected_learn_more_link', { fingerPrintChangedFaq: links.go.fingerPrintChangedFaq }),
						{
							ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
							ALLOWED_ATTR: ['href', 'title'],
						},
					),
				}}
			/>
		</GenericModal>
	);
};

export default FingerprintChangeModal;
