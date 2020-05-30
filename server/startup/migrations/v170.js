import { Migrations } from '../../migrations';
import { LivechatRooms } from '../../../app/models/server';

Migrations.add({
	version: 170,
	up() {
		LivechatRooms.update(
			{ t: 'l', whatsAppGateway: { $exists: 1 } },
			{ $rename: { whatsAppGateway: 'customFields.whatsAppGateway' } },
			{ multi: true },
		);
	},
});
