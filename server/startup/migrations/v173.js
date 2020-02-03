import {
	Migrations,
} from '../../../app/migrations';
import {
	Rooms,
} from '../../../app/models';
import { MessageTypes } from '../../../app/lib/server/lib/messageTypes';


Migrations.add({
	version: 173,
	up() {
		Rooms.update({ sysMes: true }, { $unset: { sysMes: '' } }, { multi: true });
		Rooms.update({ sysMes: false }, { $set: MessageTypes.map(({ key }) => key) }, { multi: true });
	},
});
