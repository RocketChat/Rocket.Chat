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
		<GenericModal variant='warning' title={t('Warning')} onConfirm={onConfirm} onCancel={onCancel} confirmText={t('Yes')}>
			<Box
				is='p'
				mbe={16}
				dangerouslySetInnerHTML={{
					__html: newWorkspace ? t('This is a new workspace') : t('This is a configuration update'),
				}}
			/>
			<Box
				is='p'
				mbe={16}
				dangerouslySetInnerHTML={{
					__html: newWorkspace
						? t('Attention, by confirming a new workspace, the identification data and cloud connection data will be reset.')
						: t(
								'Attention, by confirming that this is not a new workspace the references will be kept. It may generate communication conflicts if this is in fact a new workspace.',
						  ),
				}}
			/>
			<p
				dangerouslySetInnerHTML={{
					__html: t('Are you sure?'),
				}}
			/>
		</GenericModal>
	);
};

export default FingerprintChangeModalConfirmation;
