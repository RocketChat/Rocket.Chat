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
		const visionTypes = [];
		if (RocketChat.settings.get('GoogleVision_Type_Document')) {
			visionTypes.push('document');
		}
		if (RocketChat.settings.get('GoogleVision_Type_Faces')) {
			visionTypes.push('faces');
		}
		if (RocketChat.settings.get('GoogleVision_Type_Landmarks')) {
			visionTypes.push('landmarks');
		}
		if (RocketChat.settings.get('GoogleVision_Type_Labels')) {
			visionTypes.push('labels');
		}
		if (RocketChat.settings.get('GoogleVision_Type_Logos')) {
			visionTypes.push('logos');
		}
		if (RocketChat.settings.get('GoogleVision_Type_Properties')) {
			visionTypes.push('properties');
		}
		if (RocketChat.settings.get('GoogleVision_Type_SafeSearch')) {
			visionTypes.push('safeSearch');
		}
		if (RocketChat.settings.get('GoogleVision_Type_Similar')) {
			visionTypes.push('similar');
		}
		if (this.enabled && this.serviceAccount && visionTypes.length > 0 && message.file && message.file._id) {
			const file = RocketChat.models.Uploads.findOne({ _id: message.file._id });
			if (file && file.type && file.type.indexOf('image') !== -1 && file.store === 'googleCloudStorage' && file.googleCloudStorage) {
				const storage = Npm.require('@google-cloud/storage');
				const vision = Npm.require('@google-cloud/vision');
				const storageClient = storage({ credentials: this.serviceAccount });
				const visionClient = vision({ credentials: this.serviceAccount });
				const bucket = storageClient.bucket(file.googleCloudStorage.bucket);
				const bucketFile = bucket.file(`${file.googleCloudStorage.path}${file._id}`);

				visionClient.detect(bucketFile, visionTypes, Meteor.bindEnvironment((error, results) => {
					if (!error) {
						// use message.file._id and message.file.name to update attachment where elemMatch image_url /file-upload/_id/name
						if (visionTypes.length === 1) {
							const update = {};
							update[`attachments.0.googleVision.${visionTypes[0]}`] = results;
							RocketChat.models.Messages.update({ _id: message._id }, { $set: update });
						} else {
							RocketChat.models.Messages.update({ _id: message._id }, { $set: { 'attachments.0.googleVision': results } });
						}
					}
				}));
			}
		}
	}
}

RocketChat.GoogleVision = new GoogleVision;
