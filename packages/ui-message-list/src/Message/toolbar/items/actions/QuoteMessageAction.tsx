import { isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import type { ITranslatedMessage, IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

import { useMessageInteractions } from '../../../contexts/MessageInteractionsContext';
import MessageToolbarItem from '../../MessageToolbarItem';

export type QuoteMessageActionProps = {
	message: IMessage & Partial<ITranslatedMessage>;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const QuoteMessageAction = ({ message, room, subscription }: QuoteMessageActionProps) => {
	const { quote } = useMessageInteractions();
	const { t } = useTranslation();

	const isFederationBlocked = isRoomFederated(room) && !isRoomNativeFederated(room);

	if (isFederationBlocked || !subscription) {
		return null;
	}

	return <MessageToolbarItem id='quote-message' icon='quote' title={t('Quote')} onClick={() => quote(message)} />;
};

export default QuoteMessageAction;
