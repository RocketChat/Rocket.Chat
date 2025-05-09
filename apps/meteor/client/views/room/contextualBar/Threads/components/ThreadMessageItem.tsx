import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { Box, Bubble, MessageDivider } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import SystemMessage from '../../../../../components/message/variants/SystemMessage';
import ThreadMessage from '../../../../../components/message/variants/ThreadMessage';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import { useDateRef } from '../../../providers/DateListProvider';

type ThreadMessageProps = {
	message: IThreadMessage | IThreadMainMessage;
	previous: IThreadMessage | IThreadMainMessage;
	sequential: boolean;
	shouldShowAsSequential: boolean;
	showUserAvatar: boolean;
	firstUnread: boolean;
	system: boolean;
};

export const ThreadMessageItem = ({
	message,
	previous,
	shouldShowAsSequential,
	showUserAvatar,
	firstUnread,
	system,
}: ThreadMessageProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();
	const ref = useDateRef();

	const newDay = isMessageNewDay(message, previous);

	const showDivider = newDay || firstUnread;

	return (
		<>
			{showDivider && (
				<Box
					role='listitem'
					ref={ref}
					data-id={message.ts}
					{...(newDay && {
						'data-time': new Date(message.ts)
							.toISOString()
							.replaceAll(/[-T:.]/g, '')
							.substring(0, 8),
					})}
				>
					<MessageDivider unreadLabel={firstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
						{newDay && (
							<Bubble small secondary>
								{formatDate(message.ts)}
							</Bubble>
						)}
					</MessageDivider>
				</Box>
			)}
			{system ? (
				<SystemMessage message={message} showUserAvatar={showUserAvatar} />
			) : (
				<ThreadMessage message={message} sequential={shouldShowAsSequential} unread={firstUnread} showUserAvatar={showUserAvatar} />
			)}
		</>
	);
};
