import { Meteor } from 'meteor/meteor';

import { openRoom } from '../../../ui-utils';
import { RoomSettingsEnum, UiTextContext, RoomMemberActions } from '../../../utils';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';
import {
    IRoomTypeConfig,
    IRoomTypeRouteConfig,
    RoomTypeConfig,
    RoomTypeRouteConfig,
} from '../../../utils/lib/RoomTypeConfig';
import { ISettingsBase } from '../../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../../models/lib';
import { IAuthorization } from '../../../authorization/lib/IAuthorizationUtils';
import { ISubscriptionRepository } from '../../../models/lib/ISubscriptionRepository';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';

export class PublicRoomRoute extends RoomTypeRouteConfig implements IRoomTypeRouteConfig {
    constructor() {
        super({
            name: 'channel',
            path: '/channel/:name',
        });
    }

    action(params: any): any {
        return openRoom('c', params.name);
    }
}

export class PublicRoomType extends RoomTypeConfig implements IRoomTypeConfig {
    private readonly Subscriptions: ISubscriptionRepository;
    private UserCommonUtils: IUserCommonUtils;

    constructor(settings: ISettingsBase,
                Users: IUsersRepository,
                Rooms: IRoomsRepository,
                AuthorizationUtils: IAuthorization,
                Subscriptions: ISubscriptionRepository,
                UserCommonUtils: IUserCommonUtils) {
        super({
                identifier: 'c',
                order: 30,
                icon: 'hashtag',
                label: 'Channels',
                route: new PublicRoomRoute(),
            },
            settings,
            Users,
            Rooms,
            AuthorizationUtils);
        this.Subscriptions = Subscriptions;
        this.UserCommonUtils = UserCommonUtils;
    }

    getIcon(roomData: any): string | undefined {
        if (roomData.prid) {
            return 'discussion';
        }
        return this.icon;
    }

    findRoom(identifier: string): any {
        const query = {
            t: 'c',
            name: identifier,
        };
        return this.Rooms.findOne(query);
    }

    roomName(roomData: any): string {
        if (roomData.prid) {
            return roomData.fname;
        }
        if (this.settings.get('UI_Allow_room_names_with_special_chars')) {
            return roomData.fname || roomData.name;
        }
        return roomData.name;
    }

    condition(): boolean {
        const groupByType = this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarGroupByType');
        return groupByType && (this.AuthorizationUtils.hasAtLeastOnePermission(Meteor.userId() as string, ['view-c-room', 'view-joined-room']) || this.settings.get('Accounts_AllowAnonymousRead') === true);
    }

    showJoinLink(roomId: string): boolean {
        return !!this.Rooms.findOne({ _id: roomId, t: 'c' });
    }

    includeInRoomSearch(): boolean {
        return true;
    }

    isGroupChat(): boolean {
        return true;
    }

    includeInDashboard(): boolean {
        return true;
    }

    canAddUser(room: any): boolean {
        return this.AuthorizationUtils.hasAtLeastOnePermission(Meteor.userId() as string, ['add-user-to-any-c-room', 'add-user-to-joined-room'], room._id);
    }

    canSendMessage(roomId: string): boolean {
        const room = this.Rooms.findOne({ _id: roomId, t: 'c' }, { fields: { prid: 1 } });
        if (room.prid) {
            return true;
        }

        // TODO: remove duplicated code
        return this.Subscriptions.find({
            rid: roomId,
        }).count() > 0;
    }

    enableMembersListProfile(): boolean {
        return true;
    }

    allowRoomSettingChange(room: any, setting: string): boolean {
        switch (setting) {
            case RoomSettingsEnum.BROADCAST:
                return room.broadcast;
            case RoomSettingsEnum.READ_ONLY:
                return !room.broadcast;
            case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
                return !room.broadcast && room.ro;
            case RoomSettingsEnum.E2E:
                return false;
            case RoomSettingsEnum.SYSTEM_MESSAGES:
            default:
                return true;
        }
    }

    allowMemberAction(room: any, action: string): boolean {
        switch (action) {
            case RoomMemberActions.BLOCK:
                return false;
            default:
                return true;
        }
    }

    getUiText(context: string): string {
        switch (context) {
            case UiTextContext.HIDE_WARNING:
                return 'Hide_Room_Warning';
            case UiTextContext.LEAVE_WARNING:
                return 'Leave_Room_Warning';
            default:
                return '';
        }
    }

    getAvatarPath(roomData: any): string {
        // TODO: change to always get avatar from _id when rooms have avatars

        return getAvatarURL({ username: `@${ this.roomName(roomData) }` });
    }

    getDiscussionType(): string {
        return 'c';
    }
}
