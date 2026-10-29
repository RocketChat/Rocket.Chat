import { Bubble, MessageDivider } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useFormatDate } from '../../hooks/useFormatDate';

export type MessageListDividerProps = {
	/** The day that starts here, when one does. */
	day: Date | undefined;
	isFirstUnread: boolean;
};

const MessageListDivider = ({ day, isFirstUnread }: MessageListDividerProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	return (
		<div role='listitem'>
			<MessageDivider unreadLabel={isFirstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
				{day && (
					<Bubble small secondary>
						{formatDate(day)}
					</Bubble>
				)}
			</MessageDivider>
		</div>
	);
};

export default MessageListDivider;
