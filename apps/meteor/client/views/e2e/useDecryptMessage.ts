import { IMessage } from '@rocket.chat/core-typings';
import { useState, useEffect } from 'react';

import { e2e } from '../../../app/e2e/client/rocketchat.e2e';
import { useTranslation } from '../../contexts/TranslationContext';

type Message = {
	rid?: string;
	t?: IMessage['t'];
	text?: string;
	msg?: IMessage['msg'];
};

const useDecryptMessage = (message: Message): string => {
	const [decryptedMessage, setDecryptedMessage] = useState(message.text || message.msg);
	const t = useTranslation();

	useEffect(() => {
		if (message.t !== 'e2e' || !message.text || !message.rid) {
			return;
		}

		e2e
			.decryptMessage({
				...message,
				msg: message.text,
			})
			.then((decryptedMsg) => {
				if (!decryptedMsg.msg) {
					setDecryptedMessage(t('E2E_message_encrypted_placeholder'));
					return;
				}
				setDecryptedMessage(decryptedMsg.msg);
			});
	}, [message, t]);

	return decryptedMessage as string;
};

export default useDecryptMessage;
