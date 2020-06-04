import { IUserCommonUtils, UserCommonUtils } from '../lib/IUserCommonUtils';
import { Users } from '../../models/server';
import { settings } from '../../settings/server';
import { CommonUtils, ICommonUtils } from '../lib/ICommonUtils';
import { AbstractRoomCommonUtils, IRoomCommonUtils } from '../lib/IRoomCommonUtils';
import { ISettingsBase } from '../../settings/lib/settings';

class RoomCommonUtils extends AbstractRoomCommonUtils implements IRoomCommonUtils {
	public constructor(settings: ISettingsBase, CommonUtils: ICommonUtils) {
		super(settings, CommonUtils);
	}

	openRoom(): Promise<any> {
		return Promise.resolve();
	}

	// eslint-disable-next-line
	roomExit(): void {

	}
}

export const commonUtils: ICommonUtils = new CommonUtils(settings);
export const userCommonUtils: IUserCommonUtils = new UserCommonUtils(Users, settings, commonUtils);
export const roomCommonUtils: IRoomCommonUtils = new RoomCommonUtils(settings, commonUtils);
