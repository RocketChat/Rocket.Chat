import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { Trans, useTranslation } from 'react-i18next';

type WarningModalProps = {
	onConfirm: () => void;
	onCancel: () => void;
};

const WarningModal = ({ onConfirm, onCancel }: WarningModalProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const handleNavigate = () => {
		onCancel();
		router.navigate({
			name: 'admin-ABAC',
			params: {
				tab: 'rooms',
			},
		});
	};

	return (
		<GenericModal
			title={t('ABAC_Warning_Modal_Title')}
			variant='secondary-danger'
			confirmText={t('ABAC_Warning_Modal_Confirm_Text')}
			cancelText={t('Cancel')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onClose={onCancel}
			onDismiss={onCancel}
		>
			<Trans i18nKey='ABAC_Warning_Modal_Content'>
				You will not be able to automatically or manually manage users in existing ABAC-managed rooms. To restore a room's default access
				control, it must be removed from ABAC management in
				<Box is='a' onClick={handleNavigate}>
					{' '}
					ABAC {'>'} Rooms
				</Box>
				.
			</Trans>
		</GenericModal>
	);
};

export default WarningModal;
