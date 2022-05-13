import { parser } from '@rocket.chat/message-parser';

import { callbacks } from '../../../lib/callbacks';
import { isE2EEMessage } from '../../../lib/isE2EEMessage';
import { SystemLogger } from '../../lib/logger/system';

if (process.env.DISABLE_MESSAGE_PARSER !== 'true') {
	callbacks.add(
		'beforeSaveMessage',
		(message) => {
			if (!message.msg || isE2EEMessage(message)) {
				return message;
			}
			try {
				message.md = parser(message.msg);
			} catch (e) {
				SystemLogger.error(e); // errors logged while the parser is at experimental stage
			}

			return message;
		},
		callbacks.priority.HIGH,
		'markdownParser',
	);
}
