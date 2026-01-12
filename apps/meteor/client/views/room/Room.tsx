import { isInviteSubscription } from '@rocket.chat/core-typings';
import { ContextualbarSkeleton } from '@rocket.chat/ui-client';
import { useSetting, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { createElement, lazy, memo, Suspense } from 'react';
import { FocusScope } from 'react-aria';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import RoomE2EESetup from './E2EESetup/RoomE2EESetup';
import Header from './Header';
import MessageHighlightProvider from './MessageList/providers/MessageHighlightProvider';
import RoomInvite from './RoomInvite';
import RoomBody from './body/RoomBody';
import { useRoom, useRoomSubscription } from './contexts/RoomContext';
import { useAppsContextualBar } from './hooks/useAppsContextualBar';
import RoomLayout from './layout/RoomLayout';
import ChatProvider from './providers/ChatProvider';
import { DateListProvider } from './providers/DateListProvider';
import { SelectedMessagesProvider } from './providers/SelectedMessagesProvider';

const UiKitContextualBar = lazy(() => import('./contextualBar/uikit/UiKitContextualBar'));

const Room = (): ReactElement => {
	const { t } = useTranslation();
	const room = useRoom();
	const subscription = useRoomSubscription();
	const toolbox = useRoomToolbox();
	const contextualBarView = useAppsContextualBar();
	const isE2EEnabled = useSetting('E2E_Enable');
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages');
	const shouldDisplayE2EESetup = room?.encrypted && !unencryptedMessagesAllowed && isE2EEnabled;
	const roomLabel =
		room.t === 'd' ? t('Conversation_with__roomName__', { roomName: room.name }) : t('Channel__roomName__', { roomName: room.name });

	if (subscription && isInviteSubscription(subscription)) {
		return (
			<FocusScope>
				<RoomInvite room={room} subscription={subscription} data-qa-rc-room={room._id} aria-label={roomLabel} />
			</FocusScope>
		);
	}

	return (
		<ChatProvider>
			<MessageHighlightProvider>
				<FocusScope>
					<DateListProvider>
						<RoomLayout
							data-qa-rc-room={room._id}
							aria-label={roomLabel}
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
									// TODO: improve fallback handling
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
