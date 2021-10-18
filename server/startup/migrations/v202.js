import { addMigration } from '../../lib/migrations';
import Uploads from '../../../app/models/server/models/Uploads';

addMigration({
	version: 202,
	up() {
		Promise.await(Uploads.model.rawCollection().updateMany({
			type: 'audio/mp3',
		}, {
			$set: {
				type: 'audio/mpeg',
			},
		}));
	},
});
