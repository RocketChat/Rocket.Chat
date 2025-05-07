import { CachedChatRoom } from './models/CachedChatRoom';
import { CachedChatSubscription } from './models/CachedChatSubscription';
import { Messages } from './models/Messages';
import { AuthzCachedCollection, Permissions } from './models/Permissions';
import { Roles } from './models/Roles';
import { RoomRoles } from './models/RoomRoles';
import { Rooms } from './models/Rooms';
import { Subscriptions } from './models/Subscriptions';
import { UserRoles } from './models/UserRoles';
import { Users } from './models/Users';
import type { IMessage } from '@rocket.chat/core-typings';




export {
	Roles,
	CachedChatRoom,
	CachedChatSubscription,
	RoomRoles,
	UserRoles,
	AuthzCachedCollection,
	Permissions,
	/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
	Users,
	/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
	Rooms,
	/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
	Subscriptions,
	/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
	Messages,
	findByCustomFieldAndRoomI(customField: string, value: string, roomId: string): FindCursor<IMessage> {
		return this.find({
			[`customFields.${customField}`]: value,
			rid: roomId,
		});
	}
	
};
