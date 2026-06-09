import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export const useScheduleMenuItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();

	return [
		{
			id: 'schedule-new-message',
			icon: 'clock',
			content: t('Schedule_new_message'),
		},
		{
			id: 'view-scheduled-messages',
			icon: 'list',
			content: t('View_scheduled_messages'),
		},
	];
};
