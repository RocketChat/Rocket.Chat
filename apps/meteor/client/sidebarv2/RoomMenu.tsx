import type { RoomType } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import { useRoomMenuActions } from '../hooks/useRoomMenuActions';

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

	const isUnread = alert || unread || threadUnread;
	const sections = useRoomMenuActions({ rid, type, name, isUnread, cl, roomOpen, hideDefaultOptions });

	return <GenericMenu detached title={t('Options')} mini aria-keyshortcuts='alt' sections={sections} />;
};

export default memo(RoomMenu);
