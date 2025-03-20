import { SidebarBanner } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useStatusDisabledModal } from '../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

const StatusDisabledBanner = ({ onDismiss }: { onDismiss: () => void }) => {
	const { t } = useTranslation();
	const handleStatusDisabledModal = useStatusDisabledModal();

	return (
		<SidebarBanner
			text={t('User_status_temporarily_disabled')}
			description={t('Learn_more')}
			onClose={onDismiss}
			onClick={handleStatusDisabledModal}
		/>
	);
};

export default StatusDisabledBanner;
