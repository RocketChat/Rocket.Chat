import {
	Migrations,
} from '../../../app/migrations';
import {
	Users,
} from '../../../app/models';


Migrations.add({
	version: 171,
	up() {
		return Users.update(
			{
				'settings.preferences.roomCounterSidebar': {
					$exists: true,
				},
			}, {
				$unset: {
					'settings.preferences.roomCounterSidebar': 1,
				},
			}, {
				multi: true,
			},
		);
	},
});
