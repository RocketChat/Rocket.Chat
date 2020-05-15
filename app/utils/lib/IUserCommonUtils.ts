import { IUsersRepository } from '../../models/lib';
import { ISettingsBase } from '../../settings/lib/settings';

export interface IUserCommonUtils {
    getUserPreference(userId: string, key: string, defaultValue?: any): any;
}

export class UserCommonUtils implements  IUserCommonUtils{
    private Users: IUsersRepository;
    private settings: ISettingsBase;

    constructor(Users: IUsersRepository, settings: ISettingsBase) {
        this.Users = Users;
        this.settings = settings;
    }

    getUserPreference(userId: string, key: string, defaultValue: any): any {
        let preference;
        const user = this.Users.findOneById(userId, { fields: { [`settings.preferences.${ key }`]: 1 } });
        if (user && user.settings && user.settings.preferences
            && user.settings.preferences.hasOwnProperty(key)) {
            preference = user.settings.preferences[key];
        } else if (defaultValue === undefined) {
            preference = this.settings.get(`Accounts_Default_User_Preferences_${ key }`);
        }

        return preference ? preference : defaultValue;
    }
}