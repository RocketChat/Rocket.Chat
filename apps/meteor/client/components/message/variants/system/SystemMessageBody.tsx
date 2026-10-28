import type { IMessage } from '@rocket.chat/core-typings';
import { MessageSystemBody } from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { useTranslation } from 'react-i18next';

type SystemMessageBodyProps = {
	message: IMessage;
};

const SystemMessageBody = ({ message }: SystemMessageBodyProps) => {
	const { t } = useTranslation();
	const messageType = MessageTypes.getType(message);

	if (!messageType) {
		return null;
	}

	return (
		<MessageSystemBody
			role='document'
			aria-roledescription={t('system_message_body')}
			style={
				message.t === 'livechat_transfer_history'
					? { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }
					: undefined
			}
		>
			{messageType.text(t, message)}
		</MessageSystemBody>
	);
};

export default SystemMessageBody;
