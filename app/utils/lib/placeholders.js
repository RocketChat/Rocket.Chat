import { settings } from '../../settings';
import s from 'underscore.string';

export const placeholders = {
	replace: (str, data) => {
		if (!str) {
			return '';
		}

		str = str.replace(/\[Site_Name\]/g, settings.get('Site_Name') || '');
		str = str.replace(/\[Site_URL\]/g, settings.get('Site_Url') || '');
		
		if (str.includes('[Invite_Link]')) {
			const invite_link = Meteor.runAsUser(Meteor.userId(), () => Meteor.call('getInviteLink'));
			str = str.replace(/\[Invite_Link\]/g, invite_link);
		}

		if (str.includes('[Username]')) {
			str = str.replace(/\[Username\]/g, Meteor.user().username)
		}

		if (str.includes('[Avatar_Link]')) {
			str = str.replace(/\[Avatar_Link\]/g, `${ settings.get('Site_Url').slice(0, -1) }${ getAvatarUrlFromUsername(Meteor.user().username) }`);
	        }

		if (data) {
			str = str.replace(/\[name\]/g, data.name || '');
			str = str.replace(/\[fname\]/g, s.strLeft(data.name, ' ') || '');
			str = str.replace(/\[lname\]/g, s.strRightBack(data.name, ' ') || '');
			str = str.replace(/\[email\]/g, data.email || '');
			str = str.replace(/\[password\]/g, data.password || '');
			str = str.replace(/\[reason\]/g, data.reason || '');
			str = str.replace(/\[User\]/g, data.user || '');
			str = str.replace(/\[Room\]/g, data.room || '');

			if (data.unsubscribe) {
				str = str.replace(/\[unsubscribe\]/g, data.unsubscribe);
			}
		}

		str = str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');

		return str;
	},
};
