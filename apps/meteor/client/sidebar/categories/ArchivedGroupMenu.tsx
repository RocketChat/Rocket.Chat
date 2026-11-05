import { GenericMenu } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMuteArchivedRoomsItem } from './hooks/useMuteArchivedRoomsItem';

type ArchivedGroupMenuProps = {
	/** The archived rooms. */
	rooms: SubscriptionWithRoom[];
};

/** The menu of the Archived group: nothing to move, filter or create, only to mute or unmute what is kept there. */
const ArchivedGroupMenu = ({ rooms }: ArchivedGroupMenuProps) => {
	const { t } = useTranslation();
	const muteItem = useMuteArchivedRoomsItem({ rooms });

	return <GenericMenu detached icon='kebab' title={t('Options')} size='mini' items={[muteItem]} />;
};

export default memo(ArchivedGroupMenu);
