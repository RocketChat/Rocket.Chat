import { Migrations } from '../../migrations';
import { Uploads } from '../../../app/models';

Migrations.add({
	version: 163,
	up() {
		/*
		 * Migrate existing `rocketchat_uploads` documents to include the typeGroup
		 */

		Uploads.find({
			type: {
				$exists: true,
			},
			typeGroup: {
				$exists: false,
			},
		}).forEach((upload) => {
			Uploads.model.direct.update({
				_id: upload._id,
			}, {
				$set: {
					typeGroup: upload.type.split('/').shift(),
				},
			});
		});
	},
});
