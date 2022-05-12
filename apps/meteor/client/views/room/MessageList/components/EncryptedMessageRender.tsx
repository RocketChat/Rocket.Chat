import { IMessage } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import { useMessageActions } from '../../contexts/MessageContext';
import { useParsedMessage } from '../hooks/useParsedMessage';

const EncryptedMessageRender = ({ message }: { message: IMessage }): ReactElement => {
	const tokens = useParsedMessage(message.msg);
	const t = useTranslation();

	const {
		actions: { openUserCard, openRoom },
	} = useMessageActions();

	if (message.e2e === 'pending') {
		return <>{t('E2E_message_encrypted_placeholder')}</>;
	}

	return (
		<MessageBodyRender
			onUserMentionClick={openUserCard}
			onChannelMentionClick={openRoom}
			mentions={message?.mentions || []}
			channels={message?.channels || []}
			tokens={tokens}
		/>
	);
};

export default EncryptedMessageRender;
