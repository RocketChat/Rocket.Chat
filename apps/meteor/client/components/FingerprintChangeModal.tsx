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
			title={t('Warning')}
			onConfirm={onConfirm}
			onClose={onClose}
			onCancel={onCancel}
			confirmText={t('This is a new workspace')}
			cancelText={t('This is a configuration update')}
		>
			<Box
				is='p'
				mbe={16}
				dangerouslySetInnerHTML={{
					__html: t(
						'Apparently some of the information that identifies your deployment has changed. This can happen when information such as the configured Site URL or database connection string has changed, or when a new workspace is created from a copy of an existing database.',
					),
				}}
			/>
			<Box
				is='p'
				mbe={16}
				dangerouslySetInnerHTML={{
					__html: t('Confirmation of updating workspace data or confirming a new workspace is required.'),
				}}
			/>
			<p
				dangerouslySetInnerHTML={{
					__html: t('Attention, when confirming a new workspace, the identification data and cloud connection data will be reset.'),
				}}
			/>
		</GenericModal>
	);
};

export default FingerprintChangeModal;
