import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { createElement, lazy, memo, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ContextualbarSkeleton } from '../../components/Contextualbar';
import Header from './Header';
import MessageHighlightProvider from './MessageList/providers/MessageHighlightProvider';
import RoomBody from './body/RoomBody';
import { useRoom } from './contexts/RoomContext';
import { useRoomToolbox } from './contexts/RoomToolboxContext';
import { useAppsContextualBar } from './hooks/useAppsContextualBar';
import RoomLayout from './layout/RoomLayout';
import ChatProvider from './providers/ChatProvider';
import { SelectedMessagesProvider } from './providers/SelectedMessagesProvider';

const UiKitContextualBar = lazy(() => import('./contextualBar/uikit/UiKitContextualBar'));

const Room = (): ReactElement => {
	const t = useTranslation();
	const room = useRoom();
	const toolbox = useRoomToolbox();
	const contextualBarView = useAppsContextualBar();

	return (
		<ChatProvider>
			<MessageHighlightProvider>
				<RoomLayout
					aria-label={t('Channel')}
					data-qa-rc-room={room._id}
					header={<Header room={room} />}
					body={<RoomBody />}
					aside={
						(toolbox.tab?.tabComponent && (
							<ErrorBoundary fallback={null}>
								<SelectedMessagesProvider>
									<Suspense fallback={<ContextualbarSkeleton />}>{createElement(toolbox.tab.tabComponent)}</Suspense>
								</SelectedMessagesProvider>
							</ErrorBoundary>
						)) ||
						(contextualBarView && (
							<ErrorBoundary fallback={null}>
								<SelectedMessagesProvider>
									<Suspense fallback={<ContextualbarSkeleton />}>
										<UiKitContextualBar key={contextualBarView.id} initialView={contextualBarView} />
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
