import { IUserCommonUtils, UserCommonUtils } from '../lib/IUserCommonUtils';
import { Users } from '../../models/server';
import { settings } from '../../settings/server';
import { CommonUtils, ICommonUtils } from '../lib/ICommonUtils';
import { AbstractRoomCommonUtils, IRoomCommonUtils } from '../lib/IRoomCommonUtils';
import { ISettingsBase } from '../../settings/lib/settings';

class RoomCommonUtils extends AbstractRoomCommonUtils implements IRoomCommonUtils {

    constructor(settings: ISettingsBase, CommonUtils: ICommonUtils) {
        super(settings, CommonUtils);
    }

    openRoom(type: string, name: string): Promise<any> {
        return Promise.resolve()
    }

}

export const commonUtils: ICommonUtils = new CommonUtils(settings);
export const userCommonUtils: IUserCommonUtils = new UserCommonUtils(Users, settings, commonUtils);
export const roomCommonUtils: IRoomCommonUtils = new RoomCommonUtils(settings, commonUtils);