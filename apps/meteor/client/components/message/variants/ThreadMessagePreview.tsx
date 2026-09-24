import {
	Skeleton,
	ThreadMessageRow,
	ThreadMessageLeftContainer,
	ThreadMessageIconThread,
	ThreadMessageContainer,
	ThreadMessageOrigin,
	ThreadMessageUnfollow,
	MessageStatusIndicatorItem,
} from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMessageBody } from '../../../views/room/MessageList/hooks/useMessageBody';
import { useParentMessage } from '../../../views/room/MessageList/hooks/useParentMessage';
import { isParsedMessage } from '../../../views/room/MessageList/lib/isParsedMessage';
import { useGoToThread } from '../../../views/room/hooks/useGoToThread';
import { useShowTranslated } from '../list/MessageListContext';
import ThreadMessagePreviewBody from './threadPreview/ThreadMessagePreviewBody';
import ThreadMessagePreviewFrame from './threadPreview/ThreadMessagePreviewFrame';
import type { ThreadMessagePreviewFrameProps } from './threadPreview/ThreadMessagePreviewFrame';

export type ThreadMessagePreviewProps = Omit<ThreadMessagePreviewFrameProps, 'origin' | 'onOpen'>;

/** A thread reply preview that opens a group: the line naming the message the thread started from, above the reply */
const ThreadMessagePreview = ({ message, ...props }: ThreadMessagePreviewProps) => {
	const { t } = useTranslation();
	const parentMessage = useParentMessage(message.tmid);
	const translated = useShowTranslated(message);
	const goToThread = useGoToThread();

	const messageType = parentMessage.isSuccess ? MessageTypes.getType(parentMessage.data) : null;
	const messageBody = useMessageBody(parentMessage.data);
	const previewMessage = isParsedMessage(messageBody) ? { md: messageBody } : { msg: messageBody };

	const origin = (
		<ThreadMessageRow>
			<ThreadMessageLeftContainer>
				<ThreadMessageIconThread />
			</ThreadMessageLeftContainer>
			<ThreadMessageContainer>
				<ThreadMessageOrigin system={!!messageType}>
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
					{messageType?.text(t, message)}
					{parentMessage.isLoading && <Skeleton />}
				</ThreadMessageOrigin>
				<ThreadMessageUnfollow />
			</ThreadMessageContainer>
		</ThreadMessageRow>
	);

	const openThread = () => {
		if (parentMessage.isSuccess) {
			goToThread({ rid: message.rid, tmid: message.tmid, msg: parentMessage.data?._id });
		}
	};

	return <ThreadMessagePreviewFrame message={message} origin={origin} onOpen={openThread} {...props} />;
};

export default memo(ThreadMessagePreview);
