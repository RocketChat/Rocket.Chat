import { Migrations } from '../../../app/migrations/server';

import { Messages, Permissions, Rooms, Settings } from '../../../app/models/server';

const getField = (msg, fieldType, fieldName) => {
	if (!msg.attachments) {
		return;
	}
	const [attachments] = msg.attachments;
	if (!attachments) {
		return;
	}
	if (!attachments.fields) {
		return;
	}
	const field = attachments.fields.find(({ type }) => fieldType === type);
	return field && field[fieldName];
};

Migrations.add({
	version: 139,
	up() {
		Messages.find({ trid: { $exists: true } }).forEach((msg) => {
			const dlm = getField(msg, 'lastMessageAge', 'lm');
			const dcount = getField(msg, 'messageCounter', 'count');
			if (dlm === undefined || dcount === undefined) {
				return;
			}

			const update = {
				$set: {
					t: 'discussion-created',
					dlm,
					dcount,
				},
				$unset: {
					attachments: 1,
				},
			};

			if (msg.t) {
				const room = Rooms.findOne({ _id: msg.trid }, { fields: { fname: 1 } });
				if (room) {
					update.$set.msg = room.fname;
				}
			}

			Messages.update({ _id: msg._id }, update);
		});

		Messages.update({ t: 'thread-created' }, {
			$set: {
				t: 'discussion-created',
			},
		}, { multi: true });

		Messages.update({ trid: { $exists: true } }, {
			$rename: {
				trid: 'drid',
			},
		}, { multi: true });

		const settingEnabled = Settings.findOne({ _id: 'Thread_from_context_menu' });
		const settingRetention = Settings.findOne({ _id: 'RetentionPolicy_DoNotExcludeThreads' });
		const settingSidebar = Settings.findOne({ _id: 'Accounts_Default_User_Preferences_sidebarShowThreads' });

		if (settingEnabled) {
			Settings.upsert({
				_id: 'Discussion_enabled',
			}, {
				$set: {
					value: settingEnabled.value !== 'none',
				},
			});
		}

		if (settingRetention) {
			Settings.upsert({
				_id: 'RetentionPolicy_DoNotExcludeDiscussion',
			}, {
				$set: {
					value: settingRetention.value,
				},
			});
		}

		if (settingSidebar) {
			Settings.upsert({
				_id: 'Accounts_Default_User_Preferences_sidebarShowDiscussion',
			}, {
				$set: {
					value: settingSidebar.value,
				},
			});
		}

		Settings.remove({
			_id: {
				$in: ['Thread_from_context_menu', 'Accounts_Default_User_Preferences_sidebarShowThreads', 'RetentionPolicy_DoNotExcludeThreads'],
			},
		});

		Permissions.find({
			_id: { $in: ['start-thread', 'start-thread-other-user'] },
		}).forEach((perm) => {
			Permissions.remove({ _id: perm._id });

			const newId = perm._id === 'start-thread' ? 'start-discussion' : 'start-discussion-other-user';

			delete perm._id;

			Permissions.upsert({
				_id: newId,
			}, {
				$set: perm,
			});
		});
	},
});
