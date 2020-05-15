import { Meteor } from 'meteor/meteor';

import { IRoomTypeConfig, RoomTypeConfig } from '../../../utils/lib/RoomTypeConfig';
import { ISettingsBase } from '../../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../../models/lib';
import { IAuthorization } from '../../../authorization/lib/IAuthorizationUtils';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';

export class UnreadRoomType extends RoomTypeConfig implements IRoomTypeConfig {
    public unread: boolean;
    private UserCommonUtils: IUserCommonUtils;

    constructor(settings: ISettingsBase,
                Users: IUsersRepository,
                Rooms: IRoomsRepository,
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
            AuthorizationUtils);
        this.UserCommonUtils = UserCommonUtils;
        this.unread = true;
    }

    condition(): boolean {
        return this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarShowUnread');
    }
}
