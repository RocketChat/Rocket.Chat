import { SidebarV2Banner } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useStatusDisabledModal } from '../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

type StatusDisabledSectionProps = { onDismiss: () => void };

const StatusDisabledSection = ({ onDismiss }: StatusDisabledSectionProps) => {
	const { t } = useTranslation();
	const handleStatusDisabledModal = useStatusDisabledModal();

	return (
		<SidebarV2Banner
			title={t('User_status_temporarily_disabled')}
			linkText={t('Learn_more')}
			onClose={onDismiss}
			linkProps={{ onClick: handleStatusDisabledModal, tabIndex: 0 }}
		/>
	);
};

export default StatusDisabledSection;
