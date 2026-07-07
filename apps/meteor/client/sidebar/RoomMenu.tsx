import type { RoomType } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation, useUserSubscription } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import { useRoomMenuActions } from '../hooks/useRoomMenuActions';
import RoomMenuWithCategories from '../views/navigation/sidebar/categories/RoomMenuWithCategories';

type RoomMenuProps = {
	rid: string;
	unread?: boolean;
	threadUnread?: boolean;
	alert?: boolean;
	roomOpen?: boolean;
	type: RoomType;
	cl?: boolean;
	name?: string;
	hideDefaultOptions: boolean;
};

const RoomMenu = ({ rid, unread, threadUnread, alert, roomOpen, type, cl, name = '', hideDefaultOptions = false }: RoomMenuProps) => {
	const t = useTranslation();
	const subscription = useUserSubscription(rid);

	const isUnread = alert || unread || threadUnread;
	const sections = useRoomMenuActions({ rid, type, name, isUnread, cl, roomOpen, hideDefaultOptions });

	// Regular rooms get the kebab menu with the "Move to" category submenu; omnichannel/queued items keep the plain menu.
	if (!hideDefaultOptions && type !== 'l') {
		return <RoomMenuWithCategories sections={sections} room={{ rid, name, isFavorite: Boolean(subscription?.f) }} />;
	}

	return <GenericMenu detached title={t('Options')} mini aria-keyshortcuts='alt' sections={sections} />;
};

export default memo(RoomMenu);
