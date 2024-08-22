import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

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
	const t = useTranslation();
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
					__html: newWorkspace ? t('Confirm_new_workspace_description') : t('Confirm_configuration_update_description'),
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

export default FingerprintChangeModalConfirmation;
