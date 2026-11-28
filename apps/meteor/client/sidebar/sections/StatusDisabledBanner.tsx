import { SidebarBanner, SidebarBannerButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useStatusDisabledModal } from '../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

export type StatusDisabledSectionProps = { onDismiss: () => void };

const StatusDisabledSection = ({ onDismiss }: StatusDisabledSectionProps) => {
	const { t } = useTranslation();
	const handleStatusDisabledModal = useStatusDisabledModal();

	return (
		<SidebarBanner title={t('User_status_temporarily_disabled')} onClose={onDismiss} closeLabel={t('Close')}>
			<SidebarBannerButton onClick={handleStatusDisabledModal}>{t('Learn_more')}</SidebarBannerButton>
		</SidebarBanner>
	);
};

export default StatusDisabledSection;
