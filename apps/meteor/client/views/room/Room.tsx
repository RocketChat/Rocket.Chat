import { FocusScope } from '@react-aria/focus';
import { isInviteSubscription } from '@rocket.chat/core-typings';
import { ContextualbarSkeleton } from '@rocket.chat/ui-client';
import { useSetting, useRoomToolbox, useUserId } from '@rocket.chat/ui-contexts';
import { useMediaCallOpenRoomTracker } from '@rocket.chat/ui-voip';
import { createElement, lazy, memo, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import ClassificationBanner from './ClassificationBanner';
import RoomE2EESetup from './E2EESetup/RoomE2EESetup';
import Header from './Header';
import MessageHighlightProvider from './MessageList/providers/MessageHighlightProvider';
import RoomInvite from './RoomInvite';
import RoomTabs from './RoomTabs';
import { useActiveRoomTab } from './RoomTabs/hooks/useActiveRoomTab';
import { useRoomTabsEnabled } from './RoomTabs/hooks/useRoomTabsEnabled';
import { useThreadsTabOnRoomOpen } from './RoomTabs/hooks/useThreadsTabOnRoomOpen';
import MediaCallRoom from './body/MediaCallRoom';
import RoomBody from './body/RoomBody';
import { useRoom, useRoomSubscription } from './contexts/RoomContext';
import { useAppsContextualBar } from './hooks/useAppsContextualBar';
import RoomLayout from './layout/RoomLayout';
import ChatProvider from './providers/ChatProvider';
import { DateListProvider } from './providers/DateListProvider';
import { SelectedMessagesProvider } from './providers/SelectedMessagesProvider';
import GenericError from '../../components/GenericError';

const UiKitContextualBar = lazy(() => import('./contextualBar/uikit/UiKitContextualBar'));
const ThreadsView = lazy(() => import('./RoomTabs/ThreadsView'));

const Room = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const room = useRoom();
	const subscription = useRoomSubscription();
	const toolbox = useRoomToolbox();
	const contextualBarView = useAppsContextualBar();
	const isE2EEnabled = useSetting('E2E_Enable');
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages');
	const shouldDisplayE2EESetup = room?.encrypted && !unencryptedMessagesAllowed && isE2EEnabled;
	const showRoomTabs = useRoomTabsEnabled() && !shouldDisplayE2EESetup;
	const activeRoomTab = useActiveRoomTab();
	const isThreadsTabActive = showRoomTabs && activeRoomTab === 'threads';
	useThreadsTabOnRoomOpen(showRoomTabs);
	const roomLabel =
		room.t === 'd' ? t('Conversation_with__roomName__', { roomName: room.name }) : t('Channel__roomName__', { roomName: room.name });

	useMediaCallOpenRoomTracker(room._id);

	if (subscription && isInviteSubscription(subscription)) {
		return (
			<FocusScope>
				<RoomInvite userId={userId} room={room} subscription={subscription} data-qa-rc-room={room._id} aria-label={roomLabel} />
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
							classificationBanner={<ClassificationBanner />}
							header={<Header room={room} divider={!showRoomTabs} />}
							tabs={showRoomTabs && <RoomTabs />}
							body={
								(shouldDisplayE2EESetup && <RoomE2EESetup />) ||
								(isThreadsTabActive && <ThreadsView />) || (
									<MediaCallRoom>
										<RoomBody />
									</MediaCallRoom>
								)
							}
							aside={
								// The contextual bar belongs to the Chat tab: it stays open there, out of sight while another tab shows.
								!isThreadsTabActive &&
								((toolbox.tab?.tabComponent && (
									<ErrorBoundary fallback={<GenericError icon='circle-exclamation' />}>
										<SelectedMessagesProvider>
											<Suspense fallback={<ContextualbarSkeleton />}>{createElement(toolbox.tab.tabComponent)}</Suspense>
										</SelectedMessagesProvider>
									</ErrorBoundary>
								)) ||
									(contextualBarView && (
										// TODO: improve fallback handling
										<ErrorBoundary fallback={<GenericError icon='circle-exclamation' />}>
											<SelectedMessagesProvider>
												<Suspense fallback={<ContextualbarSkeleton />}>
													<UiKitContextualBar key={contextualBarView.id} initialView={contextualBarView} />
												</Suspense>
											</SelectedMessagesProvider>
										</ErrorBoundary>
									)))
							}
						/>
					</DateListProvider>
				</FocusScope>
			</MessageHighlightProvider>
		</ChatProvider>
	);
};

export default memo(Room);
