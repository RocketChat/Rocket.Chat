import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { createElement, lazy, memo, Suspense } from 'react';
import { FocusScope } from 'react-aria';
import { ErrorBoundary } from 'react-error-boundary';

import RoomE2EESetup from './E2EESetup/RoomE2EESetup';
import Header from './Header';
import { HeaderV2 } from './HeaderV2';
import MessageHighlightProvider from './MessageList/providers/MessageHighlightProvider';
import RoomBody from './body/RoomBody';
import RoomBodyV2 from './body/RoomBodyV2';
import { useRoom } from './contexts/RoomContext';
import { useRoomToolbox } from './contexts/RoomToolboxContext';
import { useAppsContextualBar } from './hooks/useAppsContextualBar';
import RoomLayout from './layout/RoomLayout';
import ChatProvider from './providers/ChatProvider';
import { DateListProvider } from './providers/DateListProvider';
import { SelectedMessagesProvider } from './providers/SelectedMessagesProvider';
import { ContextualbarSkeleton } from '../../components/Contextualbar';

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
							header={
								<>
									<FeaturePreview feature='newNavigation'>
										<FeaturePreviewOn>
											<HeaderV2 room={room} />
										</FeaturePreviewOn>
										<FeaturePreviewOff>
											<Header room={room} />
										</FeaturePreviewOff>
									</FeaturePreview>
								</>
							}
							body={
								shouldDisplayE2EESetup ? (
									<RoomE2EESetup />
								) : (
									<>
										<FeaturePreview feature='newNavigation'>
											<FeaturePreviewOn>
												<RoomBodyV2 />
											</FeaturePreviewOn>
											<FeaturePreviewOff>
												<RoomBody />
											</FeaturePreviewOff>
										</FeaturePreview>
									</>
								)
							}
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
