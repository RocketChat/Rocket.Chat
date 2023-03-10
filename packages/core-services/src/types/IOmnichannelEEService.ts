import type { IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IOmnichannelEEService extends IServiceClass {
	placeRoomOnHold(
		room: Pick<IOmnichannelRoom, '_id' | 't' | 'open' | 'onHold'>,
		comment: string,
		onHoldBy: Pick<IUser, '_id' | 'username' | 'name'>,
	): Promise<void>;

	resumeRoomOnHold(
		room: Pick<IOmnichannelRoom, '_id' | 't' | 'open' | 'onHold' | 'servedBy'>,
		comment: string,
		resumeBy: Pick<IUser, '_id' | 'username' | 'name'>,
		clientAction?: boolean,
	): Promise<void>;
}
