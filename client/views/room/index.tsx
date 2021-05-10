import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, FC } from 'react';

import { IRoom } from '../../../definition/IRoom';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUserPreference } from '../../contexts/UserContext';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import Announcement from './Announcement';
import Header from './Header';
import { MessageList } from './MessageList';
import LazyComponent from './Room/LazyComponent';
import BlazeTemplate from './components/BlazeTemplate';
import { RoomTemplate } from './components/RoomTemplate/RoomTemplate';
import VerticalBarOldActions from './components/VerticalBarOldActions';
import {
	useTab,
	useTabBarOpen,
	useTabBarClose,
	useTabBarOpenUserInfo,
} from './providers/ToolboxProvider';

export const Room: FC<{ room: IRoom }> = ({ room }) => {
	const t = useTranslation();
	const tab = useTab();
	const open = useTabBarOpen();
	const close = useTabBarClose();
	const openUserInfo = useTabBarOpenUserInfo();
	const isLayoutEmbedded = useEmbeddedLayout();

	const hideFlexTab = useUserPreference('hideFlexTab');
	const isOpen = useMutableCallback(() => !!(tab && tab.template));

	const tabBar = useMemo(() => ({ open, close, isOpen, openUserInfo }), [
		open,
		close,
		isOpen,
		openUserInfo,
	]);

	return (
		<RoomTemplate aria-label={t('Channel')} data-qa-rc-room={room._id}>
			<RoomTemplate.Header>
				<Header room={room} />
			</RoomTemplate.Header>
			<RoomTemplate.Body>
				{!isLayoutEmbedded && room.announcement && (
					<Announcement announcement={room.announcement} />
				)}
				<MessageList />
				<BlazeTemplate
					onClick={hideFlexTab ? close : undefined}
					name='roomOld'
					tabBar={tabBar}
					rid={room._id}
					_id={room._id}
				/>
			</RoomTemplate.Body>
			{tab && (
				<RoomTemplate.Aside data-qa-tabbar-name={tab.id}>
					{typeof tab.template === 'string' && (
						<VerticalBarOldActions
							{...tab}
							name={tab.template}
							tabBar={tabBar}
							rid={room._id}
							_id={room._id}
						/>
					)}
					{typeof tab.template !== 'string' && (
						<LazyComponent
							template={tab.template}
							tabBar={tabBar}
							rid={room._id}
							teamId={room.teamId}
							_id={room._id}
						/>
					)}
				</RoomTemplate.Aside>
			)}
		</RoomTemplate>
	);
};
