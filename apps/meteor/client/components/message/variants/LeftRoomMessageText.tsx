import type { IMessage } from '@rocket.chat/core-typings';
import type { MessageTypes } from '@rocket.chat/message-types';
import { useUserRoom } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

const roomFields = { prid: 1 } as const;

type LeftRoomMessageTextProps = {
	message: IMessage;
	messageType: NonNullable<ReturnType<(typeof MessageTypes)['getType']>>;
};

// Only "left" messages are worded differently inside a discussion, so only they read the room
const LeftRoomMessageText = ({ message, messageType }: LeftRoomMessageTextProps) => {
	const { t } = useTranslation();
	const isDiscussion = Boolean(useUserRoom(message.rid, roomFields)?.prid);

	return <>{messageType.text(t, message, { isDiscussion })}</>;
};

export default LeftRoomMessageText;
