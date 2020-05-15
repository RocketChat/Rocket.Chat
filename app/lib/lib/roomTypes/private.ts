import { Meteor } from 'meteor/meteor';

import { roomTypes } from '../../../utils';
import {
    IRoomTypeConfig,
    IRoomTypeRouteConfig,
    RoomTypeRouteConfig,
    RoomTypeConfig,
    RoomSettingsEnum,
    UiTextContext,
    RoomMemberActions
} from '../../../utils/lib/RoomTypeConfig';
import { ISettingsBase } from '../../../settings/lib/settings';
import { IUsersRepository, IRoomsRepository } from '../../../models/lib';
import { IAuthorization } from '../../../authorization/lib/IAuthorizationUtils';
import { ISubscriptionRepository } from '../../../models/lib/ISubscriptionRepository';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { IRoomCommonUtils } from '../../../utils/lib/IRoomCommonUtils';

export class PrivateRoomRoute extends RoomTypeRouteConfig implements IRoomTypeRouteConfig {
    private RoomCommonUtils: IRoomCommonUtils;
    constructor(RoomCommonUtils: IRoomCommonUtils) {
        super({
            name: 'group',
            path: '/group/:name',
        });
        this.action = this.action.bind(this);
        this.RoomCommonUtils = RoomCommonUtils;
    }

    async action(params: any): Promise<any> {
        return this.RoomCommonUtils.openRoom('p', params.name);
    }
}

export class PrivateRoomType extends RoomTypeConfig implements IRoomTypeConfig {
    private UserCommonUtils: IUserCommonUtils;
    private RoomCommonUtils: IRoomCommonUtils;

    constructor(settings: ISettingsBase,
                Users: IUsersRepository,
                Rooms: IRoomsRepository,
                Subscriptions: ISubscriptionRepository,
                AuthorizationUtils: IAuthorization,
                UserCommonUtils: IUserCommonUtils,
                RoomCommonUtils: IRoomCommonUtils) {
        super({
                identifier: 'p',
                order: 40,
                icon: 'lock',
                label: 'Private_Groups',
                route: new PrivateRoomRoute(RoomCommonUtils),
            },
            settings,
            Users,
            Rooms,
            Subscriptions,
            AuthorizationUtils);
        this.UserCommonUtils = UserCommonUtils;
        this.RoomCommonUtils = RoomCommonUtils;
    }

    getIcon(roomData: any): string | undefined {
        if (roomData.prid) {
            return 'discussion';
        }
        return this.icon;
    }

    findRoom(identifier: string): any {
        const query = {
            t: 'p',
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
        return groupByType && this.AuthorizationUtils.hasPermission(Meteor.userId() as string, 'view-p-room');
    }

    isGroupChat(): boolean {
        return true;
    }

    canAddUser(room: any): boolean {
        return this.AuthorizationUtils.hasAtLeastOnePermission(Meteor.userId() as string, ['add-user-to-any-p-room', 'add-user-to-joined-room'], room._id);
    }

    canSendMessage(roomId: string): boolean {
        return this.Subscriptions.find({ rid: roomId }).count() > 0;
    }

    allowRoomSettingChange(room: any, setting: string): boolean {
        switch (setting) {
            case RoomSettingsEnum.JOIN_CODE:
                return false;
            case RoomSettingsEnum.BROADCAST:
                return room.broadcast;
            case RoomSettingsEnum.READ_ONLY:
                return !room.broadcast;
            case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
                return !room.broadcast && room.ro;
            case RoomSettingsEnum.E2E:
                return this.settings.get('E2E_Enable') === true;
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

    enableMembersListProfile(): boolean {
        return true;
    }

    getUiText(context: string): string {
        switch (context) {
            case UiTextContext.HIDE_WARNING:
                return 'Hide_Group_Warning';
            case UiTextContext.LEAVE_WARNING:
                return 'Leave_Group_Warning';
            default:
                return '';
        }
    }

    getAvatarPath(roomData: any): string {
        // TODO: change to always get avatar from _id when rooms have avatars

        // if room is not a discussion, returns the avatar for its name
        if (!roomData.prid) {
            return this.UserCommonUtils.getUserAvatarURL(`@${ this.roomName(roomData) }`);
        }

        // if discussion's parent room is known, get his avatar
        let options: any = {};
        if (Meteor.isClient) {
            options.reactive = false;
        }
        const proom = this.Rooms.findOne({ _id: roomData.prid }, options);
        if (proom) {
            return roomTypes.getConfig(proom.t).getAvatarPath(proom);
        }

        // otherwise gets discussion's avatar via _id
        return this.RoomCommonUtils.getRoomAvatarURL(roomData.prid);
    }

    includeInDashboard(): boolean {
        return true;
    }
}
