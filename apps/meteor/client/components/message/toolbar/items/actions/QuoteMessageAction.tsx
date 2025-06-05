import type { ITranslatedMessage, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

import { useChat } from '../../../../../views/room/contexts/ChatContext';
import { useMessageListAutoTranslate } from '../../../list/MessageListContext';
import MessageToolbarItem from '../../MessageToolbarItem';

type QuoteMessageActionProps = {
	message: IMessage & Partial<ITranslatedMessage>;
	subscription: ISubscription | undefined;
};

const QuoteMessageAction = ({ message, subscription }: QuoteMessageActionProps) => {
	const chat = useChat();
	const autoTranslateOptions = useMessageListAutoTranslate();
	const { t } = useTranslation();

	if (!chat || !subscription) {
		return null;
	}

	return (
		<MessageToolbarItem
			id='quote-message'
			icon='quote'
			title={t('Quote')}
			qa='Quote'
			onClick={() => {
				if (message && autoTranslateOptions?.autoTranslateEnabled && autoTranslateOptions.showAutoTranslate(message)) {
					message.msg =
						message.translations && autoTranslateOptions.autoTranslateLanguage
							? message.translations[autoTranslateOptions.autoTranslateLanguage]
							: message.msg;
				}

				chat?.composer?.quoteMessage(message);
			}}
		/>
	);
};

export default QuoteMessageAction;
