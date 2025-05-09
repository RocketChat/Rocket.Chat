import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from './GenericModal';

type FingerprintChangeModalConfirmationProps = {
	onConfirm: () => void;
	onCancel: () => void;
	newWorkspace: boolean;
};

const FingerprintChangeModalConfirmation = ({
	onConfirm,
	onCancel,
	newWorkspace,
}: FingerprintChangeModalConfirmationProps): ReactElement => {
	const { t } = useTranslation();
	return (
		<GenericModal
			variant='warning'
			title={newWorkspace ? t('Confirm_new_workspace') : t('Confirm_configuration_update')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			cancelText={t('Back')}
			confirmText={newWorkspace ? t('Confirm_new_workspace') : t('Confirm_configuration_update')}
		>
			<Box
				is='p'
				mbe={16}
				dangerouslySetInnerHTML={{
					__html: newWorkspace
						? DOMPurify.sanitize(t('Confirm_new_workspace_description'))
						: DOMPurify.sanitize(t('Confirm_configuration_update_description')),
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

export default FingerprintChangeModalConfirmation;
