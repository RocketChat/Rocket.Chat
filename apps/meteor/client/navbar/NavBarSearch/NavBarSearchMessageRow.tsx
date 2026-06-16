import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Icon, SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import type { UnifiedSearchIntelligentResult, UnifiedSearchMessageResult } from '@rocket.chat/rest-typings';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarSearchItem from './NavBarSearchItem';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type NavBarSearchMessageRowProps = {
	item: UnifiedSearchMessageResult | UnifiedSearchIntelligentResult;
	onClick: () => void;
	type: 'message' | 'intelligent';
};

const getMessageId = (item: UnifiedSearchMessageResult | UnifiedSearchIntelligentResult): string | undefined =>
	'msgId' in item ? item.msgId : item._id;

const getRoom = (
	item: UnifiedSearchMessageResult | UnifiedSearchIntelligentResult,
): Pick<IRoom, '_id' | 't' | 'name' | 'fname'> | undefined => item.room;

const getText = (item: UnifiedSearchMessageResult | UnifiedSearchIntelligentResult): string => {
	if ('text' in item) {
		return item.text;
	}

	return item.msg || '';
};

const getHref = (item: UnifiedSearchMessageResult | UnifiedSearchIntelligentResult): string | undefined => {
	const room = getRoom(item);
	const rid = 'rid' in item ? item.rid : undefined;
	const msgId = getMessageId(item);

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

const NavBarSearchMessageRow = ({ item, onClick, type }: NavBarSearchMessageRowProps): ReactElement => {
	const { t } = useTranslation();
	const room = getRoom(item);
	const text = getText(item);
	const title = text.trim() || t(type === 'intelligent' ? 'Intelligent_Search_Result' : 'Message');
	const roomLabel = room?.fname || room?.name;
	const href = getHref(item);

	return (
		<NavBarSearchItem
			id={`search-${type}-${item._id}`}
			href={href}
			onClick={onClick}
			title={title}
			avatar={null}
			icon={<SidebarV2ItemIcon icon={<Icon name={type === 'intelligent' ? 'stars' : 'post'} size='x16' />} />}
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
