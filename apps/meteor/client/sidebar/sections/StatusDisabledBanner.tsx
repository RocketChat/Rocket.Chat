import { SidebarBanner } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useStatusDisabledModal } from '../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

export type StatusDisabledSectionProps = { onDismiss: () => void };

const StatusDisabledSection = ({ onDismiss }: StatusDisabledSectionProps) => {
	const { t } = useTranslation();
	const handleStatusDisabledModal = useStatusDisabledModal();

	return (
		<SidebarBanner
			title={t('User_status_temporarily_disabled')}
			linkText={t('Learn_more')}
			onClose={onDismiss}
			closeLabel={t('Close')}
			linkProps={{ onClick: handleStatusDisabledModal }}
		/>
	);
};

export default StatusDisabledSection;
