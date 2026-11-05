import type { RoomType } from '@rocket.chat/core-typings';
import { GenericMenu, useIsEnterprise } from '@rocket.chat/ui-client';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import CategoryRoomMenu from './categories/CategoryRoomMenu';
import { useRoomMenuActions } from '../hooks/useRoomMenuActions';

export type RoomMenuProps = {
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
	const { t } = useTranslation();
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();

	const isUnread = alert || unread || threadUnread;
	const sections = useRoomMenuActions({ rid, type, name, isUnread, cl, roomOpen, hideDefaultOptions });

	if (isEnterprise && !hideDefaultOptions && type !== 'l') {
		return <CategoryRoomMenu rid={rid} name={name} sections={sections} />;
	}

	// Without a submenu to list both states, a choice section keeps only the item that changes the state.
	const flatSections = sections.map(({ selectedId, items, ...section }) => ({
		...section,
		items: selectedId ? items.filter((item) => item.id !== selectedId).map(({ addon: _addon, ...item }) => item) : items,
	}));

	return <GenericMenu detached title={t('Options')} size='mini' aria-keyshortcuts='alt' sections={flatSections} />;
};

export default memo(RoomMenu);
