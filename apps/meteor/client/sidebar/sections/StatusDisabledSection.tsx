import { SidebarV2Banner } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useStatusDisabledModal } from '../../views/admin/customUserStatus/hooks/useStatusDisabledModal';

const StatusDisabledSection = ({ onDismiss }: { onDismiss: () => void }) => {
	const t = useTranslation();
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
