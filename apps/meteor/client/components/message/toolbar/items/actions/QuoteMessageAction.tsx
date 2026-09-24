import {
	type ITranslatedMessage,
	type IMessage,
	type ISubscription,
	isRoomFederated,
	isRoomNativeFederated,
} from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../../../../../views/room/contexts/RoomContext';
import { useMessageActions, useMessageActionsPolicy } from '../../../list/MessageListContext';
import MessageToolbarItem from '../../MessageToolbarItem';

export type QuoteMessageActionProps = {
	message: IMessage & Partial<ITranslatedMessage>;
	subscription: ISubscription | undefined;
};

const QuoteMessageAction = ({ message, subscription }: QuoteMessageActionProps) => {
	const { chatAvailable } = useMessageActionsPolicy();
	const actions = useMessageActions();
	const { t } = useTranslation();

	const room = useRoom();

	const isFederated = room && isRoomFederated(room);
	const isFederationBlocked = isFederated && !isRoomNativeFederated(room);

	if (isFederationBlocked) {
		return null;
	}

	if (!chatAvailable || !subscription) {
		return null;
	}

	return <MessageToolbarItem id='quote-message' icon='quote' title={t('Quote')} onClick={() => actions.quote(message)} />;
};

export default QuoteMessageAction;
