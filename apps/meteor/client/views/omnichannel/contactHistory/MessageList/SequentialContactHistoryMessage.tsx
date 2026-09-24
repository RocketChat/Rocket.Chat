import type { IMessage } from '@rocket.chat/core-typings';
import { memo } from 'react';

import ContactHistoryMessageFrame from './ContactHistoryMessageFrame';
import StatusIndicators from '../../../../components/message/StatusIndicators';

export type SequentialContactHistoryMessageProps = {
	message: IMessage;
	isNewDay: boolean;
	showUserAvatar: boolean;
};

/** A contact history message that continues the group above it: no avatar nor header, its status indicators on the left */
const SequentialContactHistoryMessage = ({ message, isNewDay, showUserAvatar }: SequentialContactHistoryMessageProps) => (
	<ContactHistoryMessageFrame
		message={message}
		isNewDay={isNewDay}
		showUserAvatar={showUserAvatar}
		leading={<StatusIndicators message={message} />}
	/>
);

export default memo(SequentialContactHistoryMessage);
