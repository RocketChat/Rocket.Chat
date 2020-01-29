import {
	Migrations,
} from '../../../app/migrations';
import {
	Rooms,
} from '../../../app/models';


Migrations.add({
	version: 173,
	up() {
		Rooms.update({ sysMes: { $exists: 1 } }, { $unset: { sysMes: '' } });
	},
});
