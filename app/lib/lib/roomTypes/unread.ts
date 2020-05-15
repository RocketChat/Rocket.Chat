import { Meteor } from 'meteor/meteor';

import { IRoomTypeConfig, RoomTypeConfig } from '../../../utils/lib/RoomTypeConfig';
import { ISettingsBase } from '../../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../../models/lib';
import { IAuthorization } from '../../../authorization/lib/IAuthorizationUtils';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { ISubscriptionRepository } from '../../../models/lib/ISubscriptionRepository';

export class UnreadRoomType extends RoomTypeConfig implements IRoomTypeConfig {
    public unread: boolean;
    private UserCommonUtils: IUserCommonUtils;

    constructor(settings: ISettingsBase,
                Users: IUsersRepository,
                Rooms: IRoomsRepository,
                Subscriptions: ISubscriptionRepository,
                AuthorizationUtils: IAuthorization,
                UserCommonUtils: IUserCommonUtils) {
        super({
                identifier: 'unread',
                order: 10,
                label: 'Unread',
            },
            settings,
            Users,
            Rooms,
            Subscriptions,
            AuthorizationUtils);
        this.UserCommonUtils = UserCommonUtils;
        this.unread = true;
    }

    condition(): boolean {
        return this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarShowUnread');
    }
}
