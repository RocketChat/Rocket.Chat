import { isOTRAckMessage, isOTRMessage, type IThreadMessage } from '@rocket.chat/core-typings';
import {
	Skeleton,
	ThreadMessage,
	ThreadMessageRow,
	ThreadMessageLeftContainer,
	ThreadMessageIconThread,
	ThreadMessageContainer,
	ThreadMessageOrigin,
	ThreadMessageUnfollow,
	MessageStatusIndicatorItem,
} from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { MouseEvent, KeyboardEvent, ComponentProps, ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { MessageTypes } from '../../../../app/ui-utils/client';
import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useMessageBody } from '../../../views/room/MessageList/hooks/useMessageBody';
import { useParentMessage } from '../../../views/room/MessageList/hooks/useParentMessage';
import { isParsedMessage } from '../../../views/room/MessageList/lib/isParsedMessage';
import { useGoToThread } from '../../../views/room/hooks/useGoToThread';
import { useShowTranslated } from '../list/MessageListContext';
import ThreadMessagePreviewBody from './threadPreview/ThreadMessagePreviewBody';

type ThreadMessageParentLinkProps = {
	message: IThreadMessage;
} & ComponentProps<typeof ThreadMessage>;

const useLinkPattern = ({ onPress }: { onPress: (e: MouseEvent<Element> | KeyboardEvent<Element>) => void }) => {
	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			onPress(event);
		}
	};

	return { onClick: onPress, onKeyDown: handleKeyDown, role: 'link', tabIndex: 0 };
};

const ThreadMessageParentLink = ({ message, ...props }: ThreadMessageParentLinkProps): ReactElement => {
	const parentMessage = useParentMessage(message.tmid);

	const translated = useShowTranslated(message);
	const { t } = useTranslation();

	const isSelecting = useIsSelecting();
	const isOTRMsg = isOTRMessage(message) || isOTRAckMessage(message);

	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id, isOTRMsg);
	useCountSelected();

	const messageType = parentMessage.isSuccess ? MessageTypes.getType(parentMessage.data) : null;
	const messageBody = useMessageBody(parentMessage.data);

	const previewMessage = isParsedMessage(messageBody) ? { md: messageBody } : { msg: messageBody };

	const goToThread = useGoToThread();

	const handleClick = useEffectEvent(() => {
		if (!isSelecting && parentMessage.isSuccess) {
			return goToThread({
				rid: message.rid,
				tmid: message.tmid,
				msg: parentMessage.data?._id,
			});
		}

		if (isOTRMsg) {
			return toggleSelected();
		}

		return toggleSelected();
	});

	const linkProps = useLinkPattern({
		onPress: handleClick,
	});

	const threadMessageProps = {
		'aria-roledescription': isOTRMsg ? t('OTR_thread_message_preview') : t('thread_message_preview'),
		isSelected,
		'data-qa-selected': isSelected,
		...linkProps,
		...props,
	};

	return (
		<ThreadMessage {...threadMessageProps}>
			<ThreadMessageRow>
				<ThreadMessageLeftContainer>
					<ThreadMessageIconThread />
				</ThreadMessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageOrigin>
						{parentMessage.isSuccess && !messageType && (
							<>
								{(parentMessage.data as { ignored?: boolean })?.ignored ? (
									t('Message_Ignored')
								) : (
									<ThreadMessagePreviewBody message={{ ...parentMessage.data, ...previewMessage }} />
								)}
								{translated && (
									<>
										{' '}
										<MessageStatusIndicatorItem name='language' color='info' title={t('Translated')} />
									</>
								)}
							</>
						)}
						{messageType && t(messageType.message, messageType.data ? messageType.data(message) : {})}
						{parentMessage.isLoading && <Skeleton />}
					</ThreadMessageOrigin>
					<ThreadMessageUnfollow />
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessage>
	);
};

export default memo(ThreadMessageParentLink);
