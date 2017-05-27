RocketChat.Migrations.add({
	version: 96,
	up() {
		const query = {
			$or: [{
				's3.path': {
					$exists: true
				}
			}, {
				'googleCloudStorage.path': {
					$exists: true
				}
			}]
		};

		RocketChat.models.Uploads.find(query).forEach((record) => {
			if (record.s3) {
				RocketChat.models.Uploads.model.direct.update({_id: record._id}, {
					$set: {
						'store': 'AmazonS3:Uploads',
						AmazonS3: {
							path: record.s3.path + record._id
						}
					},
					$unset: {
						s3: 1
					}
				}, {multi: true});
			} else {
				RocketChat.models.Uploads.model.direct.update({_id: record._id}, {
					$set: {
						store: 'GoogleCloudStorage:Uploads',
						GoogleStorage: {
							path: record.googleCloudStorage.path + record._id
						}
					},
					$unset: {
						googleCloudStorage: 1
					}
				}, {multi: true});
			}
		});
	}
});
