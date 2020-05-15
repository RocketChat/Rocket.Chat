import { Tracker } from "meteor/tracker";
import { IUsersRepository } from '../../models/lib';
import { ISettingsBase } from '../../settings/lib/settings';
import { ICommonUtils } from './ICommonUtils';
import { IUser } from '../../../definition/IUser';
import { settings } from '../../settings/client';
import { getAvatarURL } from './getAvatarURL';

export interface IUserCommonUtils {
	getUserPreference(user: IUser | string, key: string, defaultValue?: any): any;
	getUserAvatarURL(username: string): string;
}

export class UserCommonUtils implements IUserCommonUtils {
	private Users: IUsersRepository;

	private settings: ISettingsBase;

	private CommonUtils: ICommonUtils;

	constructor(Users: IUsersRepository, settings: ISettingsBase, CommonUtils: ICommonUtils) {
		this.Users = Users;
		this.settings = settings;
		this.CommonUtils = CommonUtils;
	}

	getUserPreference(user: IUser | string, key: string, defaultValue: any): any {
		let preference;
		let userFromDb: IUser = user as IUser;
		if (typeof user === typeof '') {
			userFromDb = this.Users.findOneById(user as string, { fields: { [`settings.preferences.${ key }`]: 1 } });
		}
		if (userFromDb && userFromDb.settings && userFromDb.settings.preferences
            && userFromDb.settings.preferences.hasOwnProperty(key)) {
			preference = userFromDb.settings.preferences[key];
		} else if (defaultValue === undefined) {
			preference = this.settings.get(`Accounts_Default_User_Preferences_${ key }`);
		}
		return preference || defaultValue;
	}

	getUserAvatarURL(username: string): string {
		const externalSource = (String(this.settings.get('Accounts_AvatarExternalProviderUrl') || '')).trim().replace(/\/$/, '');
		if (externalSource !== '') {
			return externalSource.replace('{username}', username);
		}
		if (username == null) {
			return '';
		}
		const key = `avatar_random_${ username }`;
		const cache: any = Tracker.nonreactive(() => Session && Session.get(key)); // there is no Session on server

		return this.CommonUtils.getAvatarURL({ username, cache });
	}
}
