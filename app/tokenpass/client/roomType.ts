import { Meteor } from 'meteor/meteor';

import { roomTypes } from '../../utils/client';
import { IRoomTypeConfig, RoomTypeConfig } from '../../utils/lib/RoomTypeConfig';
import { ISettingsBase } from '../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../models/lib';
import { IAuthorization } from '../../authorization/lib/IAuthorizationUtils';
import { settings } from '../../settings/client';
import { Rooms, Users } from '../../models/client';
import { AuthorizationUtils } from '../../authorization/client';

class TokenPassRoomType extends RoomTypeConfig implements IRoomTypeConfig {
    public customTemplate: string;

    constructor(settings: ISettingsBase,
                Users: IUsersRepository,
                Rooms: IRoomsRepository,
                AuthorizationUtils: IAuthorization) {
        super({
                identifier: 'tokenpass',
                order: 1,
            },
            settings,
            Users,
            Rooms,
            AuthorizationUtils);

        this.customTemplate = 'tokenChannelsList';
    }

    condition(): boolean {
        const user = this.Users.findOneById(Meteor.userId() as string, { fields: { 'services.tokenpass': 1 } });
        const hasTokenpass = !!(user && user.services && user.services.tokenpass);

        return hasTokenpass;
    }
}

roomTypes.add(new TokenPassRoomType(settings, Users, Rooms, AuthorizationUtils));
