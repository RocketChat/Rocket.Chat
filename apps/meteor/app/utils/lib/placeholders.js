import { strLeft, strRightBack } from '../../../lib/utils/stringUtils';
import { settings } from '../../settings';

export const placeholders = {
	replace: (str, data) => {
		if (!str) {
			return '';
		}

		str = str.replace(/\[Site_Name\]/g, settings.get('Site_Name') || '');
		str = str.replace(/\[Site_URL\]/g, settings.get('Site_Url') || '');

		if (data) {
			str = str.replace(/\[name\]/g, data.name || '');
			str = str.replace(/\[fname\]/g, strLeft(data.name, ' ') || '');
			str = str.replace(/\[lname\]/g, strRightBack(data.name, ' ') || '');
			str = str.replace(/\[email\]/g, data.email || '');
			str = str.replace(/\[password\]/g, data.password || '');
			str = str.replace(/\[reason\]/g, data.reason || '');
			str = str.replace(/\[User\]/g, data.user || '');
			str = str.replace(/\[Room\]/g, data.room || '');

			if (data.unsubscribe) {
				str = str.replace(/\[unsubscribe\]/g, data.unsubscribe);
			}
		}

		str = str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');

		return str;
	},
};
