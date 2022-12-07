import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import AppPermissionsList from './components/AppPermissionsList';

type AppPermissionsReviewModalProps = {
	appPermissions: Array<{ name: string; required?: boolean }>;
	onCancel: () => void;
	onConfirm: (permissionsGranted: any) => void;
};

const AppPermissionsReviewModal = ({ appPermissions, onCancel, onConfirm }: AppPermissionsReviewModalProps): ReactElement => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			title={t('Apps_Permissions_Review_Modal_Title')}
			onCancel={onCancel}
			onConfirm={(): void => onConfirm(appPermissions)}
			onClose={onCancel}
			confirmText={t('Agree')}
		>
			<Box fontScale='p2' mbe={20}>
				{t('Apps_Permissions_Review_Modal_Subtitle')}
			</Box>
			<Box is='ol' type='1' style={{ listStyleType: 'decimal' }} mis='x24'>
				<AppPermissionsList appPermissions={appPermissions} />
			</Box>
		</GenericModal>
	);
};

export default AppPermissionsReviewModal;
