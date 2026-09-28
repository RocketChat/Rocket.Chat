import { Box, Icon, SidebarItemIcon } from '@rocket.chat/fuselage';
import type { AISearchResult } from '@rocket.chat/rest-typings';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarSearchItem from './NavBarSearchItem';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

export type NavBarSearchMessageRowProps = {
	item: AISearchResult;
	onClick: () => void;
};

const getHref = ({ room, rid, msgId }: AISearchResult): string | undefined => {
	if (!room) {
		return undefined;
	}

	const href = roomCoordinator.getRouteLink(room.t, {
		rid: room._id || rid,
		name: room.name,
	});

	if (!href) {
		return undefined;
	}

	return msgId ? `${href}?msg=${encodeURIComponent(msgId)}` : href;
};

const NavBarSearchMessageRow = ({ item, onClick }: NavBarSearchMessageRowProps): ReactElement => {
	const { t } = useTranslation();
	const { room } = item;
	const title = item.text.trim() || t('Intelligent_Search_Result');
	const roomLabel = room?.fname || room?.name;
	const href = getHref(item);

	return (
		<NavBarSearchItem
			id={`search-intelligent-${item._id}`}
			href={href}
			onClick={onClick}
			title={title}
			avatar={null}
			icon={<SidebarItemIcon icon={<Icon name='stars' size='x16' />} />}
			actions={
				roomLabel ? (
					<Box color='hint' fontScale='c1' withTruncatedText flexShrink={0} maxWidth='x120'>
						{roomLabel}
					</Box>
				) : undefined
			}
		/>
	);
};

export default memo(NavBarSearchMessageRow);
