import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { createElement, memo, ReactElement, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import VerticalBarSkeleton from '../../../components/VerticalBar/VerticalBarSkeleton';
import Header from '../Header';
import VerticalBarOldActions from '../components/VerticalBarOldActions';
import RoomBody from '../components/body/RoomBody';
import { useRoom } from '../contexts/RoomContext';
import AppsContextualBar from '../contextualBar/Apps';
import { useAppsContextualBar } from '../hooks/useAppsContextualBar';
import RoomLayout from '../layout/RoomLayout';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useTab, useTabBarAPI } from '../providers/ToolboxProvider';

const Room = (): ReactElement => {
	const t = useTranslation();

	const room = useRoom();

	const tabBar = useTabBarAPI();

	const tab = useTab();
	const appsContextualBarContext = useAppsContextualBar();

	return (
		<RoomLayout
			aria-label={t('Channel')}
			data-qa-rc-room={room._id}
			header={<Header room={room} />}
			body={<RoomBody />}
			aside={
				(tab && (
					<ErrorBoundary fallback={null}>
						<SelectedMessagesProvider>
							{typeof tab.template === 'string' && (
								<VerticalBarOldActions {...tab} name={tab.template} tabBar={tabBar} rid={room._id} _id={room._id} />
							)}
							{typeof tab.template !== 'string' && typeof tab.template !== 'undefined' && (
								<Suspense fallback={<VerticalBarSkeleton />}>
									{createElement(tab.template, { tabBar, _id: room._id, rid: room._id, teamId: room.teamId })}
								</Suspense>
							)}
						</SelectedMessagesProvider>
					</ErrorBoundary>
				)) ||
				(appsContextualBarContext && (
					<ErrorBoundary fallback={null}>
						<SelectedMessagesProvider>
							<Suspense fallback={<VerticalBarSkeleton />}>
								<AppsContextualBar
									viewId={appsContextualBarContext.viewId}
									roomId={appsContextualBarContext.roomId}
									payload={appsContextualBarContext.payload}
									appId={appsContextualBarContext.appId}
								/>
							</Suspense>
						</SelectedMessagesProvider>
					</ErrorBoundary>
				))
			}
		/>
	);
};

export default memo(Room);
