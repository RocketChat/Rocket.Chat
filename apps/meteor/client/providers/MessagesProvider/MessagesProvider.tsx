import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { MessageRenderersContextValue, MessageSelectionStore } from '@rocket.chat/ui-message-list';
import {
	MessageContentContext,
	MessageDisplayContext,
	MessageInteractionsContext,
	MessageMediaContext,
	MessageNavigationContext,
	MessageRelatedDataContext,
	MessageRenderersContext,
	MessageSelectionContext,
	MessageToolbarContext,
} from '@rocket.chat/ui-message-list';
import type { ReactNode } from 'react';

import MessageMarkup from './renderers/MessageMarkup';
import MessagePreviewMarkup from './renderers/MessagePreviewMarkup';
import UiKitMessageBlock from './renderers/UiKitMessageBlock';
import { useMessageContentValue } from './useMessageContentValue';
import { useMessageDisplayValue } from './useMessageDisplayValue';
import { useMessageInteractionsValue } from './useMessageInteractionsValue';
import { useMessageMediaValue } from './useMessageMediaValue';
import { useMessageNavigationValue } from './useMessageNavigationValue';
import { useMessageRelatedDataValue } from './useMessageRelatedDataValue';
import { useMessageToolbarValue } from './useMessageToolbarValue';
import Emoji from '../../components/Emoji';
import { useChat } from '../../views/room/contexts/ChatContext';
import AttachmentProvider from '../AttachmentProvider';

const renderers: MessageRenderersContextValue = {
	Markup: MessageMarkup,
	PreviewMarkup: MessagePreviewMarkup,
	UiKitMessageBlock,
	Emoji,
};

export type MessagesProviderProps = {
	/** The conversation the messages belong to, when they belong to one. */
	room?: IRoom;
	subscription?: ISubscription;
	/** Read-only places, such as audits, show messages without their toolbar or thread metrics. */
	allowsInteraction?: boolean;
	/** The selection this place's messages join, if it has one. */
	selection?: MessageSelectionStore;
	/** The largest size an image or video attachment is shown at. */
	attachmentDimension?: { width?: number; height?: number };
	children: ReactNode;
};

/** Provides the message components with everything they need from the app, for one place that shows messages. */
const MessagesProvider = ({
	room,
	subscription,
	allowsInteraction = true,
	selection,
	attachmentDimension,
	children,
}: MessagesProviderProps) => {
	const chat = useChat();

	const display = useMessageDisplayValue({ room, subscription, allowsInteraction });
	const navigation = useMessageNavigationValue();
	const interactions = useMessageInteractionsValue(chat, subscription);
	const relatedData = useMessageRelatedDataValue();
	const content = useMessageContentValue(display, subscription);
	const media = useMessageMediaValue();
	const toolbar = useMessageToolbarValue(display, chat);

	return (
		<AttachmentProvider width={attachmentDimension?.width} height={attachmentDimension?.height}>
			<MessageDisplayContext.Provider value={display}>
				<MessageNavigationContext.Provider value={navigation}>
					<MessageInteractionsContext.Provider value={interactions}>
						<MessageRenderersContext.Provider value={renderers}>
							<MessageRelatedDataContext.Provider value={relatedData}>
								<MessageContentContext.Provider value={content}>
									<MessageMediaContext.Provider value={media}>
										<MessageToolbarContext.Provider value={toolbar}>
											<MessageSelectionContext.Provider value={selection}>{children}</MessageSelectionContext.Provider>
										</MessageToolbarContext.Provider>
									</MessageMediaContext.Provider>
								</MessageContentContext.Provider>
							</MessageRelatedDataContext.Provider>
						</MessageRenderersContext.Provider>
					</MessageInteractionsContext.Provider>
				</MessageNavigationContext.Provider>
			</MessageDisplayContext.Provider>
		</AttachmentProvider>
	);
};

export default MessagesProvider;
