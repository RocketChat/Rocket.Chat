import { GenericMenu } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useArchivedRoomsNotificationsItem } from './hooks/useArchivedRoomsNotificationsItem';

type ArchivedGroupMenuProps = {
	/** The archived rooms. */
	rooms: SubscriptionWithRoom[];
};

/** The menu of the Archived group: nothing to move, filter or create, only the notifications of what is kept there, under a section of their own. */
const ArchivedGroupMenu = ({ rooms }: ArchivedGroupMenuProps) => {
	const { t } = useTranslation();
	const notificationsItem = useArchivedRoomsNotificationsItem({ rooms });

	return (
		<GenericMenu
			detached
			icon='kebab'
			title={t('Options')}
			size='mini'
			sections={[{ title: t('Notifications'), items: [notificationsItem] }]}
		/>
	);
};

export default memo(ArchivedGroupMenu);
