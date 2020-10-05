import { watchUsers } from './watchUsers';
import { watchSettings } from './watchSettings';
import { watchRooms } from './watchRooms';
import { watchRoles } from './watchRoles';
import { watchInquiries } from './watchInquiries';
import { getConnection } from '../mongo';
import { ServiceClass, IServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { watchLoginServiceConfiguration } from './watchLoginServiceConfiguration';
import { initWatchers } from '../../../../server/modules/watchers/watchers.module';
import { MessagesRaw } from '../../../../app/models/server/raw/Messages';
import { UsersRaw } from '../../../../app/models/server/raw/Users';
import { SubscriptionsRaw } from '../../../../app/models/server/raw/Subscriptions';
import { SettingsRaw } from '../../../../app/models/server/raw/Settings';

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
		const loginServiceConfiguration = db.collection('meteor_accounts_loginServiceConfiguration');

		initWatchers({
			Messages: new MessagesRaw(Messages, Trash),
			Users: new UsersRaw(Users, Trash),
			Subscriptions: new SubscriptionsRaw(Subscriptions, Trash),
			Settings: new SettingsRaw(Settings, Trash),
		}, (model, fn) => {
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

		Users.watch([], { fullDocument: 'updateLookup' }).on('change', watchUsers);

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

		loginServiceConfiguration.watch([{ $project: { 'fullDocument.secret': 0 } }], { fullDocument: 'updateLookup' }).on('change', watchLoginServiceConfiguration);
	}
}
