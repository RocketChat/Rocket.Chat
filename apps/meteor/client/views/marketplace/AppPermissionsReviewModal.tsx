import type { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import AppPermissionsList from './components/AppPermissionsList';
import GenericModal from '../../components/GenericModal';

export type AppPermissionsReviewModalProps = {
	appPermissions: App['permissions'];
	onCancel: () => void;
	onConfirm: (permissionsGranted: AppPermissionsReviewModalProps['appPermissions']) => void;
};

const AppPermissionsReviewModal = ({ appPermissions, onCancel, onConfirm }: AppPermissionsReviewModalProps) => {
	const { t } = useTranslation();

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
