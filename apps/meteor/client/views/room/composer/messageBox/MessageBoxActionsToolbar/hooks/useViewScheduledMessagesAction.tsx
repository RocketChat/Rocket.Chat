import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

import { MessageBoxScheduledMessagesModal } from '../../MessageBoxScheduledMessagesModal';

export const useViewScheduledMessagesAction = (roomId: string): GenericMenuItemProps => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	return useMemo<GenericMenuItemProps>(
		() => ({
			id: 'view-scheduled-messages',
			content: t('View_Scheduled_Messages'),
			icon: 'clock',
			disabled: false,
			onClick: () => {
				setModal(<MessageBoxScheduledMessagesModal roomId={roomId} onClose={() => setModal(null)} />);
			},
		}),
		[t, roomId, setModal],
	);
};
