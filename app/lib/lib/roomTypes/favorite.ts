import { Meteor } from 'meteor/meteor';

import { IRoomTypeConfig, RoomTypeConfig } from '../../../utils/lib/RoomTypeConfig';
import { ISettingsBase } from '../../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../../models/lib';
import { IAuthorization } from '../../../authorization/lib/IAuthorizationUtils';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { ISubscriptionRepository } from '../../../models/lib/ISubscriptionRepository';

export class FavoriteRoomType extends RoomTypeConfig implements IRoomTypeConfig {
    private UserCommonUtils: IUserCommonUtils;

    constructor(settings: ISettingsBase,
                Users: IUsersRepository,
                Rooms: IRoomsRepository,
                Subscriptions: ISubscriptionRepository,
                AuthorizationUtils: IAuthorization,
                UserCommonUtils: IUserCommonUtils) {
        super({
                identifier: 'f',
                order: 20,
                header: 'favorite',
                icon: 'star',
                label: 'Favorites',
            },
            settings,
            Users,
            Rooms,
            Subscriptions,
            AuthorizationUtils);
        this.UserCommonUtils = UserCommonUtils;
    }

    condition(): boolean {
        return this.settings.get('Favorite_Rooms') && this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarShowFavorites');
    }
}
