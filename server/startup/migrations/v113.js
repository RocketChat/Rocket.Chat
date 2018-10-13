RocketChat.Migrations.add({
	version: 113,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Uploads && RocketChat.models.Messages) {
			const fileQuery = {
				userId: null,
			};

			const filesToUpdate = RocketChat.models.Uploads.find(fileQuery);
			filesToUpdate.forEach((file) => {
				const messageQuery = {
					'file._id' : file._id,
				};
				const message = RocketChat.models.Messages.findOne(messageQuery);
				if (message) {
					const filter = {
						_id: file._id,
					};

					const update = {
						$set: {
							userId: message.u._id,
						},
					};

					RocketChat.models.Uploads.model.direct.update(filter, update);
				}
			});
		}
	},
});
