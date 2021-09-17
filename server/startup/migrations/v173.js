import { addMigration } from '../../lib/migrations';
import {
	Rooms,
} from '../../../app/models';
import { MessageTypesValues } from '../../../app/lib/lib/MessageTypes';

addMigration({
	version: 173,
	up() {
		Rooms.update({ sysMes: true }, { $unset: { sysMes: '' } }, { multi: true });
		Rooms.update({ sysMes: false }, { $set: { sysMes: MessageTypesValues.map(({ key }) => key) } }, { multi: true });
	},
});
