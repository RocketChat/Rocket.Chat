import { Box } from '@rocket.chat/fuselage';
import { ExternalLink, GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

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
			<Box is='p' mbe={16}>
				<Trans i18nKey='Unique_ID_change_detected_description' />
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

export default FingerprintChangeModal;
