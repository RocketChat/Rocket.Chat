import { Meteor } from 'meteor/meteor';

import { IRoomTypeConfig, RoomTypeConfig } from '../../utils/lib/RoomTypeConfig';
import { ISettingsBase } from '../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../models/lib';
import { IAuthorization } from '../../authorization/lib/IAuthorizationUtils';
import { IUserCommonUtils } from '../../utils/lib/IUserCommonUtils';

export class DiscussionRoomType extends RoomTypeConfig implements IRoomTypeConfig {
    public customTemplate: string;
    private UserCommonUtils: IUserCommonUtils;

    constructor(settings: ISettingsBase,
                Users: IUsersRepository,
                Rooms: IRoomsRepository,
                AuthorizationUtils: IAuthorization,
                UserCommonUtils: IUserCommonUtils) {
        super({
                identifier: 't',
                order: 25,
                label: 'Discussion',
            },
            settings,
            Users,
            Rooms,
            AuthorizationUtils);

        // we need a custom template in order to have a custom query showing the subscriptions to discussions
        this.customTemplate = 'DiscussionList';
        this.UserCommonUtils = UserCommonUtils;
    }

    condition(): boolean {
        return this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarShowDiscussion');
    }
}

