import type { RoomType } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
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

const RoomMenu = ({
	rid,
	unread,
	threadUnread,
	alert,
	roomOpen,
	type,
	cl,
	name = '',
	hideDefaultOptions = false,
}: RoomMenuProps): ReactElement | null => {
	const t = useTranslation();
	const { sidebar } = useLayout();
	const isUnread = alert || unread || threadUnread;
	const sections = useRoomMenuActions({ rid, type, name, isUnread, cl, roomOpen, hideDefaultOptions });

	return (
		<GenericMenu
			detached
			className='rcx-sidebar-item__menu'
			title={t('Options')}
			mini
			aria-keyshortcuts='alt'
			disabled={sidebar.isCollapsed}
			sections={sections}
		/>
	);
};

export default memo(RoomMenu);
