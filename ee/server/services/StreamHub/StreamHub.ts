import { watchUsers } from './watchUsers';
import { watchMessages } from './watchMessages';
import { watchSettings } from './watchSettings';
import { watchRooms } from './watchRooms';
import { watchSubscriptions } from './watchSubscriptions';
import { watchRoles } from './watchRoles';
import { watchInquiries } from './watchInquiries';
import { getConnection } from '../mongo';
import { ServiceClass, IServiceClass } from '../../../../server/sdk/types/ServiceClass';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	async created(): Promise<void> {
		const db = await getConnection();

		const Trash = db.collection('rocketchat_trash');
		const Users = db.collection('users');
		const Roles = db.collection('rocketchat_roles');
		const Messages = db.collection('rocketchat_message');
		const Subscriptions = db.collection('rocketchat_subscription');
		const Rooms = db.collection('rocketchat_room');
		const Settings = db.collection('rocketchat_settings');
		const Inquiry = db.collection('rocketchat_livechat_inquiry');

		Users.watch([], { fullDocument: 'updateLookup' }).on('change', watchUsers);

		Messages.watch([{
			$addFields: {
				tmpfields: {
					$objectToArray: '$updateDescription.updatedFields',
				},
			} }, {
			$match: {
				'tmpfields.k': {
					$nin: ['u.username'], // avoid flood the streamer with messages changes (by username change)
				},
			} }], { fullDocument: 'updateLookup' }).on('change', watchMessages);

		Subscriptions.watch([], { fullDocument: 'updateLookup' }).on('change', watchSubscriptions(Trash));

		Inquiry.watch([], { fullDocument: 'updateLookup' }).on('change', watchInquiries);

		Rooms.watch([], { fullDocument: 'updateLookup' }).on('change', watchRooms);

		Roles.watch([], { fullDocument: 'updateLookup' }).on('change', watchRoles);

		Settings.watch([{
			$addFields: {
				tmpfields: {
					$objectToArray: '$updateDescription.updatedFields',
				},
			},
		}, {
			$match: {
				'tmpfields.k': {
					$in: ['value'], // avoid flood the streamer with messages changes (by username change)
				},
			},
		}], { fullDocument: 'updateLookup' }).on('change', watchSettings);
	}
}
