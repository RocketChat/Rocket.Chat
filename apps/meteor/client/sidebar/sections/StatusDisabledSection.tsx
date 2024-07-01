import { SidebarBanner } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useStatusDisabledModal } from '../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

const StatusDisabledSection = ({ onDismiss }: { onDismiss: () => void }) => {
	const t = useTranslation();
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

export default StatusDisabledSection;
