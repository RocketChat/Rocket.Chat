import { AtLeast, IMessage } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useEffect } from 'react';

import { e2e } from '../../app/e2e/client/rocketchat.e2e';

const useDecryptMessage = (message: AtLeast<IMessage, 'rid' | 'msg' | 't'>): string => {
	const [decryptedMessage, setDecryptedMessage] = useState(message.msg);
	const t = useTranslation();

	useEffect(() => {
		if (message.t !== 'e2e' || !message.rid) {
			return;
		}

		e2e.decryptMessage(message).then((decryptedMsg) => {
			if (!decryptedMsg.msg) {
				setDecryptedMessage(t('E2E_message_encrypted_placeholder'));
				return;
			}
			setDecryptedMessage(decryptedMsg.msg);
		});
	}, [message, t]);

	return decryptedMessage;
};

export default useDecryptMessage;
