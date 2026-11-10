import { shortnameToUnicode } from '../../../../lib/emoji-native/shortnameToUnicode';
import { callbacks } from '../../callbacks';

callbacks.add(
	'beforeSendMessageNotifications',
	(message) => shortnameToUnicode(message),
	callbacks.priority.MEDIUM,
	'native-emoji-shortnameToUnicode',
);
