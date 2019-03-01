import { Migrations } from 'meteor/rocketchat:migrations';
import { Uploads, Messages } from 'meteor/rocketchat:models';

Migrations.add({
	version: 113,
	up() {
		if (Uploads && Messages) {
			const fileQuery = {
				userId: null,
			};

			const filesToUpdate = Uploads.find(fileQuery);
			filesToUpdate.forEach((file) => {
				const messageQuery = {
					'file._id' : file._id,
				};
				const message = Messages.findOne(messageQuery);
				if (message) {
					const filter = {
						_id: file._id,
					};

					const update = {
						$set: {
							userId: message.u._id,
						},
					};

					Uploads.model.direct.update(filter, update);
				}
			});
		}
	},
});
