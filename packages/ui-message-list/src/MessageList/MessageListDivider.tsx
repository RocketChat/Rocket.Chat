import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble, MessageDivider } from '@rocket.chat/fuselage';
import { useFormatDate } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

export type MessageListDividerProps = {
	/** The day that starts here, when one does. */
	day: Date | undefined;
	isFirstUnread: boolean;
};

// The floating date stands in for the day divider under it
const dividerStyle = css`
	&[data-covered='true'] {
		opacity: 0;
	}
`;

const MessageListDivider = ({ day, isFirstUnread }: MessageListDividerProps) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	return (
		<Box role='listitem' className={dividerStyle} data-day-divider={day?.getTime()}>
			<MessageDivider unreadLabel={isFirstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
				{day && (
					<Bubble small secondary>
						{formatDate(day)}
					</Bubble>
				)}
			</MessageDivider>
		</Box>
	);
};

export default MessageListDivider;
