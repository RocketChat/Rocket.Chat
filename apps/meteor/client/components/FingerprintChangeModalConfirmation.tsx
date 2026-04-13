import { Box } from '@rocket.chat/fuselage';
import { ExternalLink, GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { links } from '../lib/links';

type FingerprintChangeModalConfirmationProps = {
	onConfirm: () => void;
	onCancel: () => void;
	onClose: () => void;
	newWorkspace: boolean;
};

const FingerprintChangeModalConfirmation = ({
	onConfirm,
	onCancel,
	onClose,
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
			onClose={onClose}
		>
			<Box is='p' mbe={16}>
				{newWorkspace ? (
					<Trans i18nKey='Confirm_new_workspace_description' />
				) : (
					<Trans i18nKey='Confirm_configuration_update_description' />
				)}
			</Box>
			<Box is='p' mbe={16}>
				<Trans
					i18nKey='Unique_ID_change_detected_learn_more_link'
					components={{ a: <ExternalLink to={links.go.fingerPrintChangedFaq} /> }}
				/>
			</Box>
		</GenericModal>
	);
};

export default FingerprintChangeModalConfirmation;
