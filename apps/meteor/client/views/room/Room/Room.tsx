import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { createElement, memo, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import VerticalBarSkeleton from '../../../components/VerticalBar/VerticalBarSkeleton';
import Header from '../Header';
import MessageHighlightProvider from '../MessageList/providers/MessageHighlightProvider';
import VerticalBarOldActions from '../components/VerticalBarOldActions';
import RoomBody from '../components/body/RoomBody';
import { useRoom } from '../contexts/RoomContext';
import { useTab, useToolboxContext } from '../contexts/ToolboxContext';
import AppsContextualBar from '../contextualBar/Apps';
import { useAppsContextualBar } from '../hooks/useAppsContextualBar';
import RoomLayout from '../layout/RoomLayout';
import ChatProvider from '../providers/ChatProvider';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';

const Room = (): ReactElement => {
	const t = useTranslation();

	const room = useRoom();

	const toolbox = useToolboxContext();

	const tab = useTab();
	const appsContextualBarContext = useAppsContextualBar();

	return (
		<ChatProvider>
			<MessageHighlightProvider>
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
										<VerticalBarOldActions {...tab} name={tab.template} tabBar={toolbox} rid={room._id} _id={room._id} />
									)}
									{typeof tab.template !== 'string' && typeof tab.template !== 'undefined' && (
										<Suspense fallback={<VerticalBarSkeleton />}>
											{createElement(tab.template, { tabBar: toolbox, _id: room._id, rid: room._id, teamId: room.teamId })}
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
			</MessageHighlightProvider>
		</ChatProvider>
	);
};

export default memo(Room);
