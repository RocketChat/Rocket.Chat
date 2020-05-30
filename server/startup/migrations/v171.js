import {
	Migrations,
} from '../../migrations';
import {
	Users,
	Settings,
} from '../../../app/models';


Migrations.add({
	version: 171,
	up() {
		Settings.remove({ _id: 'Accounts_Default_User_Preferences_roomCounterSidebar' });
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
