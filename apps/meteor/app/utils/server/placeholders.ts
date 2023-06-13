import { strLeft, strRightBack } from '../../../lib/utils/stringUtils';
import { settings } from '../../settings/server';

export const placeholders = {
	replace: (
		str: string,
		data: { name?: string; email?: string; password?: string; reason?: string; user?: string; room?: string; unsubscribe?: string },
	) => {
		if (!str) {
			return '';
		}

		str = str.replace(/\[Site_Name\]/g, settings.get<string>('Site_Name') || '');
		str = str.replace(/\[Site_URL\]/g, settings.get<string>('Site_Url') || '');

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
