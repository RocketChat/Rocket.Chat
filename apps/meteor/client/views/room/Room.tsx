import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { createElement, lazy, memo, Suspense } from 'react';
import { FocusScope } from 'react-aria';
import { ErrorBoundary } from 'react-error-boundary';

import { ContextualbarSkeleton } from '../../components/Contextualbar';
import RoomE2EESetup from './E2EESetup/RoomE2EESetup';
import Header from './Header';
import MessageHighlightProvider from './MessageList/providers/MessageHighlightProvider';
import RoomBody from './body/RoomBody';
import { useRoom } from './contexts/RoomContext';
import { useRoomToolbox } from './contexts/RoomToolboxContext';
import { useAppsContextualBar } from './hooks/useAppsContextualBar';
import RoomLayout from './layout/RoomLayout';
import ChatProvider from './providers/ChatProvider';
import { DateListProvider } from './providers/DateListProvider';
import { SelectedMessagesProvider } from './providers/SelectedMessagesProvider';

const UiKitContextualBar = lazy(() => import('./contextualBar/uikit/UiKitContextualBar'));

const Room = (): ReactElement => {
	const t = useTranslation();
	const room = useRoom();
	const toolbox = useRoomToolbox();
	const contextualBarView = useAppsContextualBar();
	const isE2EEnabled = useSetting('E2E_Enable');
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages');
	const shouldDisplayE2EESetup = room?.encrypted && !unencryptedMessagesAllowed && isE2EEnabled;

	return (
		<ChatProvider>
			<MessageHighlightProvider>
				<FocusScope>
					<DateListProvider>
						<RoomLayout
							data-qa-rc-room={room._id}
							aria-label={
								room.t === 'd'
									? t('Conversation_with__roomName__', { roomName: room.name })
									: t('Channel__roomName__', { roomName: room.name })
							}
							header={<Header room={room} />}
							body={shouldDisplayE2EESetup ? <RoomE2EESetup /> : <RoomBody />}
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
					</DateListProvider>
				</FocusScope>
			</MessageHighlightProvider>
		</ChatProvider>
	);
};

export default memo(Room);
