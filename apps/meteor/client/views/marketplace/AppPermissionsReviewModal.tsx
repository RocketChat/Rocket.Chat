import type { App } from '@rocket.chat/core-typings';
import { Stack, Text } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AppPermissionsList from './components/AppPermissionsList';
import PermissionsList from './components/layout/PermissionsList';

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
			<Stack gap='x20'>
				<Text is='p' fontScale='p2'>
					{t('Apps_Permissions_Review_Modal_Subtitle')}
				</Text>
				<PermissionsList>
					<AppPermissionsList appPermissions={appPermissions} />
				</PermissionsList>
			</Stack>
		</GenericModal>
	);
};

export default AppPermissionsReviewModal;
