import type { IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IOmnichannelEEService extends IServiceClass {
	placeRoomOnHold(room: IOmnichannelRoom, comment: string, onHoldBy: IUser): Promise<void>;
	resumeRoomOnHold(room: IOmnichannelRoom, comment: string, resumeBy: IUser, clientAction?: boolean): Promise<void>;
}
