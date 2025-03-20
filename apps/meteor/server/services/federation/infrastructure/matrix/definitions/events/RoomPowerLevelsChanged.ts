import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export interface IMatrixEventContentRoomPowerLevelsChanged extends IBaseEventContent {
	ban: number;
	events: {
		'm.room.avatar': number;
		'm.room.canonical_alias': number;
		'm.room.encryption': number;
		'm.room.history_visibility': number;
		'm.room.name': number;
		'm.room.power_levels': number;
		'm.room.server_acl': number;
		'm.room.tombstone': number;
	};
	events_default: number;
	historical: number;
	invite: number;
	kick: number;
	redact: number;
	state_default: number;
	users: Record<string, number>;
	users_default: number;
}

export class MatrixEventRoomRoomPowerLevelsChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentRoomPowerLevelsChanged;

	public type = MatrixEventType.ROOM_POWER_LEVELS_CHANGED;
}
