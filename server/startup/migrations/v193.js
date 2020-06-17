import { Migrations } from '../../../app/migrations/server';
import { Rooms } from '../../../app/models/server';

Migrations.add({
	version: 193,
	up() {
		Rooms.update({ sysMes: { $in: ['subscription_role_added'] } }, {
			$push: {
				sysMes: 'subscription-role-added',
			},
		}, { multi: true });
		Rooms.update({ sysMes: { $in: ['subscription_role_removed'] } }, {
			$push: {
				sysMes: 'subscription-role-removed',
			},
		}, { multi: true });

		Rooms.update({ sysMes: { $in: ['subscription_role_added'] } }, {
			$pull: {
				sysMes: 'subscription_role_added',
			},
		}, { multi: true });
		Rooms.update({ sysMes: { $in: ['subscription_role_removed'] } }, {
			$pull: {
				sysMes: 'subscription_role_removed',
			},
		}, { multi: true });
	},
});
