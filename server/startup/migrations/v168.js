import { Migrations } from '../../../app/migrations';
import { LivechatRooms } from '../../../app/models';

Migrations.add({
	version: 168,
	up() {
		LivechatRooms.update(
			{ t: 'l', whatsAppGateway: { $exists: 1 } },
			{ $rename: { whatsAppGateway: 'customFields.whatsAppGateway' } },
			{ multi: true },
		);
	},
});
