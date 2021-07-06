import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useDebugValue, useMemo } from 'react';

import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useUserPreference } from '../../../contexts/UserContext';
import Header from '../Header';
import BlazeTemplate from '../components/BlazeTemplate';
import { RoomTemplate } from '../components/RoomTemplate/RoomTemplate';
import VerticalBarOldActions from '../components/VerticalBarOldActions';
import { useRoom } from '../contexts/RoomContext';
import {
	useTab,
	useTabBarOpen,
	useTabBarClose,
	useTabBarOpenUserInfo,
} from '../providers/ToolboxProvider';
import Aside from './Aside';
import Body from './Body';
import Footer from './Footer';
import LazyComponent from './LazyComponent';

const Room = () => {
	const t = useTranslation();
	const room = useRoom();
	const tab = useTab();
	const open = useTabBarOpen();
	const close = useTabBarClose();
	const openUserInfo = useTabBarOpenUserInfo();

	const hideFlexTab = useUserPreference('hideFlexTab');
	const isOpen = useMutableCallback(() => !!(tab && tab.template));

	const tabBar = useMemo(
		() => ({ open, close, isOpen, openUserInfo }),
		[open, close, isOpen, openUserInfo],
	);

	useDebugValue(room);
	useDebugValue(tab);
	return (
		<RoomTemplate aria-label={t('Channel')} data-qa-rc-room={room._id}>
			<RoomTemplate.Header>
				<Header room={room} rid={room._id} />
			</RoomTemplate.Header>
			<RoomTemplate.Body>
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
					<ErrorBoundary>
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
					</ErrorBoundary>
				</RoomTemplate.Aside>
			)}
		</RoomTemplate>
	);
};

export default Object.assign(Room, {
	Header,
	Body,
	Footer,
	Aside,
});
