class GoogleVision {
	constructor() {
		this.enabled = RocketChat.settings.get('GoogleVision_Enable');
		this.serviceAccount = {};
		RocketChat.settings.get('GoogleVision_Enable', (key, value) => {
			this.enabled = value;
		});
		RocketChat.settings.get('GoogleVision_ServiceAccount', (key, value) => {
			try {
				this.serviceAccount = JSON.parse(value);
			} catch (e) {
				this.serviceAccount = {};
			}
		});
		RocketChat.callbacks.add('afterFileUpload', this.annotate.bind(this));
	}

	annotate({ message }) {
		if (this.enabled && this.serviceAccount && message.file && message.file._id) {
			const file = RocketChat.models.Uploads.findOne({ _id: message.file._id });
			if (file && file.store === 'googleCloudStorage' && file.googleCloudStorage) {
				const storage = Npm.require('@google-cloud/storage');
				const vision = Npm.require('@google-cloud/vision');
				const storageClient = storage({ credentials: this.serviceAccount });
				const visionClient = vision({ credentials: this.serviceAccount });
				const bucket = storageClient.bucket(file.googleCloudStorage.bucket);
				const bucketFile = bucket.file(`${file.googleCloudStorage.path}${file._id}`);
				const results = Meteor.wrapAsync(visionClient.detectLabels, visionClient)(bucketFile);
				if (results) {
					// use message.file._id and message.file.name to update attachment where elemMatch image_url /file-upload/_id/name
					RocketChat.models.Messages.update({ _id: message._id }, { $set: { 'attachments.0.labels': results } });
				}
			}
		}
	}
}

RocketChat.GoogleVision = new GoogleVision;
