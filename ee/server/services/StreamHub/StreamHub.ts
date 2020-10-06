import { watchUsers } from './watchUsers';
import { watchRooms } from './watchRooms';
import { watchInquiries } from './watchInquiries';
import { getConnection } from '../mongo';
import { ServiceClass, IServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { watchLoginServiceConfiguration } from './watchLoginServiceConfiguration';
import { initWatchers } from '../../../../server/modules/watchers/watchers.module';
import { MessagesRaw } from '../../../../app/models/server/raw/Messages';
import { UsersRaw } from '../../../../app/models/server/raw/Users';
import { SubscriptionsRaw } from '../../../../app/models/server/raw/Subscriptions';
import { SettingsRaw } from '../../../../app/models/server/raw/Settings';
import { RolesRaw } from '../../../../app/models/server/raw/Roles';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	async created(): Promise<void> {
		const db = await getConnection();

		const Trash = db.collection('rocketchat_trash');
		const Rooms = db.collection('rocketchat_room');
		const Inquiry = db.collection('rocketchat_livechat_inquiry');
		const loginServiceConfiguration = db.collection('meteor_accounts_loginServiceConfiguration');

		const UsersCol = db.collection('users');
		const SettingsCol = db.collection('rocketchat_settings');

		const Settings = new SettingsRaw(SettingsCol, Trash);
		const Users = new UsersRaw(UsersCol, Trash);
		const Subscriptions = new SubscriptionsRaw(db.collection('rocketchat_subscription'), Trash);
		const Messages = new MessagesRaw(db.collection('rocketchat_message'), Trash);
		const Permissions = new MessagesRaw(db.collection('rocketchat_permissions'), Trash);
		const Roles = new RolesRaw(db.collection('rocketchat_roles'), Trash, { Users, Subscriptions });

		const models = {
			Messages,
			Users,
			Subscriptions,
			Permissions,
			Settings,
			Roles,
		};

		initWatchers(models, (model, fn) => {
			model.col.watch([]).on('change', (event) => {
				switch (event.operationType) {
					case 'insert':
						fn({
							action: 'insert',
							clientAction: 'inserted',
							id: event.documentKey._id,
							data: event.fullDocument,
						});

						break;
					case 'update':
						const diff: Record<string, any> = {};

						if (event.updateDescription.updatedFields) {
							for (const key in event.updateDescription.updatedFields) {
								if (event.updateDescription.updatedFields.hasOwnProperty(key)) {
									diff[key] = event.updateDescription.updatedFields[key];
								}
							}
						}

						if (event.updateDescription.removedFields) {
							for (const key in event.updateDescription.removedFields) {
								if (event.updateDescription.removedFields.hasOwnProperty(key)) {
									diff[key] = undefined;
								}
							}
						}

						fn({
							action: 'update',
							clientAction: 'updated',
							id: event.documentKey._id,
							diff,
						});

						break;
					case 'delete':
						fn({
							action: 'remove',
							clientAction: 'removed',
							id: event.documentKey._id,
						});
						break;
				}
			});
		});

		UsersCol.watch([], { fullDocument: 'updateLookup' }).on('change', watchUsers);

		// TODO: check the improvement mentioned below that was ignored on code unification
		// Messages.watch([{
		// 	$addFields: {
		// 		tmpfields: {
		// 			$objectToArray: '$updateDescription.updatedFields',
		// 		},
		// 	} }, {
		// 	$match: {
		// 		'tmpfields.k': {
		// 			$nin: ['u.username'], // avoid flood the streamer with messages changes (by username change)
		// 		},
		// 	} }], { fullDocument: 'updateLookup' }).on('change', watchMessages);

		Inquiry.watch([], { fullDocument: 'updateLookup' }).on('change', watchInquiries);

		Rooms.watch([], { fullDocument: 'updateLookup' }).on('change', watchRooms);

		// SettingsCol.watch([{
		// 	$addFields: {
		// 		tmpfields: {
		// 			$objectToArray: '$updateDescription.updatedFields',
		// 		},
		// 	},
		// }, {
		// 	$match: {
		// 		'tmpfields.k': {
		// 			$in: ['value'], // avoid flood the streamer with messages changes (by username change)
		// 		},
		// 	},
		// }], { fullDocument: 'updateLookup' }).on('change', watchSettings);

		loginServiceConfiguration.watch([{ $project: { 'fullDocument.secret': 0 } }], { fullDocument: 'updateLookup' }).on('change', watchLoginServiceConfiguration);
	}
}
