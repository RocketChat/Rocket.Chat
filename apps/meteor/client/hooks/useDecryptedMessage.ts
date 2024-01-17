import type { IMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useState, useEffect } from 'react';

import { e2e } from '../../app/e2e/client/rocketchat.e2e';

export const useDecryptedMessage = (message: IMessage): string => {
	const t = useTranslation();
	const [decryptedMessage, setDecryptedMessage] = useSafely(useState(t('E2E_message_encrypted_placeholder')));

	useEffect(() => {
		if (!isE2EEMessage(message)) {
			return;
		}

		e2e.decryptMessage(message).then((decryptedMsg) => {
			if (decryptedMsg.msg) {
				setDecryptedMessage(decryptedMsg.msg);
			}
		});
	}, [message, t, setDecryptedMessage]);

	return isE2EEMessage(message) ? decryptedMessage : message.msg;
};
