import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, ReactElement } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import Announcement from '../Announcement';
import Header from '../Header';
import BlazeTemplate from '../components/BlazeTemplate';
import { RoomTemplate } from '../components/RoomTemplate/RoomTemplate';
import VerticalBarOldActions from '../components/VerticalBarOldActions';
import { useRoom } from '../contexts/RoomContext';
import AppsContextualBar from '../contextualBar/Apps';
import { useAppsContextualBar } from '../hooks/useAppsContextualBar';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useTab, useTabBarOpen, useTabBarClose, useTabBarOpenUserInfo } from '../providers/ToolboxProvider';
import LazyComponent from './LazyComponent';

export const Room = (): ReactElement => {
	const room = useRoom();
	const t = useTranslation();
	const tab = useTab();
	const open = useTabBarOpen();
	const close = useTabBarClose();
	const openUserInfo = useTabBarOpenUserInfo();
	const isLayoutEmbedded = useEmbeddedLayout();
	const hideFlexTab = useUserPreference('hideFlexTab');

	const isOpen = useMutableCallback(() => !!tab?.template);

	const appsContextualBarContext = useAppsContextualBar();

	const tabBar = useMemo(() => ({ open, close, isOpen, openUserInfo }), [open, close, isOpen, openUserInfo]);

	return (
		<RoomTemplate aria-label={t('Channel')} data-qa-rc-room={room._id}>
			<RoomTemplate.Header>
				<Header room={room} />
			</RoomTemplate.Header>
			<RoomTemplate.Body>
				{!isLayoutEmbedded && room.announcement && <Announcement announcement={room.announcement} announcementDetails={undefined} />}
				<BlazeTemplate onClick={hideFlexTab ? close : undefined} name='roomOld' tabBar={tabBar} rid={room._id} _id={room._id} />
			</RoomTemplate.Body>
			{tab && (
				<RoomTemplate.Aside data-qa-tabbar-name={tab.id}>
					<ErrorBoundary fallback={null}>
						<SelectedMessagesProvider>
							{typeof tab.template === 'string' && (
								<VerticalBarOldActions {...tab} name={tab.template} tabBar={tabBar} rid={room._id} _id={room._id} />
							)}
							{typeof tab.template !== 'string' && (
								<LazyComponent template={tab.template} tabBar={tabBar} rid={room._id} teamId={room.teamId} _id={room._id} />
							)}
						</SelectedMessagesProvider>
					</ErrorBoundary>
				</RoomTemplate.Aside>
			)}
			{appsContextualBarContext && (
				<RoomTemplate.Aside data-qa-tabbar-name={appsContextualBarContext.viewId}>
					<SelectedMessagesProvider>
						<ErrorBoundary fallback={null}>
							<LazyComponent
								template={AppsContextualBar}
								viewId={appsContextualBarContext.viewId}
								roomId={appsContextualBarContext.roomId}
								payload={appsContextualBarContext.payload}
								appId={appsContextualBarContext.appId}
							/>
						</ErrorBoundary>
					</SelectedMessagesProvider>
				</RoomTemplate.Aside>
			)}
		</RoomTemplate>
	);
};
