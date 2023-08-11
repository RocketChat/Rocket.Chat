import type { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import GenericModal from '../../components/GenericModal';
import AppPermissionsList from './components/AppPermissionsList';

export type AppPermissionsReviewModalProps = {
	appPermissions: App['permissions'];
	onCancel: () => void;
	onConfirm: (permissionsGranted: AppPermissionsReviewModalProps['appPermissions']) => void;
};

const AppPermissionsReviewModal: FC<AppPermissionsReviewModalProps> = ({ appPermissions, onCancel, onConfirm }) => {
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
			<Box is='ol' type='1' style={{ listStyleType: 'decimal' }} mis={24}>
				<AppPermissionsList appPermissions={appPermissions} />
			</Box>
		</GenericModal>
	);
};

export default AppPermissionsReviewModal;
