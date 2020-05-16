import { ISettingsBase } from '../../settings/lib/settings';
import { ICommonUtils } from './ICommonUtils';

export interface IRoomCommonUtils {
	getRoomAvatarURL(roomId: string): string;
	openRoom(type: string, name: string): Promise<any>;
	roomExit(): void;
}

export abstract class AbstractRoomCommonUtils {
	private settings: ISettingsBase;

	private CommonUtils: ICommonUtils;

	protected constructor(settings: ISettingsBase, CommonUtils: ICommonUtils) {
		this.settings = settings;
		this.CommonUtils = CommonUtils;
	}

	getRoomAvatarURL(roomId: string): string {
		const externalSource = String(this.settings.get('Accounts_AvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
		if (externalSource !== '') {
			return externalSource.replace('{roomId}', roomId);
		}
		if (!roomId) {
			return '';
		}
		return this.CommonUtils.getAvatarURL({ roomId });
	}
}
