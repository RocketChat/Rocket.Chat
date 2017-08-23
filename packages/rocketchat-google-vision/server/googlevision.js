class GoogleVision {
	constructor() {
		this.storage = Npm.require('@google-cloud/storage');
		this.vision = Npm.require('@google-cloud/vision');
		this.storageClient = {};
		this.visionClient = {};
		this.enabled = RocketChat.settings.get('GoogleVision_Enable');
		this.serviceAccount = {};
		RocketChat.settings.get('GoogleVision_Enable', (key, value) => {
			this.enabled = value;
		});
		RocketChat.settings.get('GoogleVision_ServiceAccount', (key, value) => {
			try {
				this.serviceAccount = JSON.parse(value);
				this.storageClient = this.storage({ credentials: this.serviceAccount });
				this.visionClient = this.vision({ credentials: this.serviceAccount });
			} catch (e) {
				this.serviceAccount = {};
			}
		});
		RocketChat.settings.get('GoogleVision_Block_Adult_Images', (key, value) => {
			if (value) {
				RocketChat.callbacks.add('beforeSaveMessage', this.blockUnsafeImages.bind(this), RocketChat.callbacks.priority.MEDIUM, 'googlevision-blockunsafe');
			} else {
				RocketChat.callbacks.remove('beforeSaveMessage', 'googlevision-blockunsafe');
			}
		});
		RocketChat.callbacks.add('afterFileUpload', this.annotate.bind(this));
	}

	incCallCount(count) {
		const currentMonth = new Date().getMonth();
		const maxMonthlyCalls = RocketChat.settings.get('GoogleVision_Max_Monthly_Calls') || 0;
		if (maxMonthlyCalls > 0) {
			if (RocketChat.settings.get('GoogleVision_Current_Month') !== currentMonth) {
				RocketChat.settings.set('GoogleVision_Current_Month', currentMonth);
				if (count > maxMonthlyCalls) {
					return false;
				}
			} else if (count + (RocketChat.settings.get('GoogleVision_Current_Month_Calls') || 0) > maxMonthlyCalls) {
				return false;
			}
		}
		RocketChat.models.Settings.update({ _id: 'GoogleVision_Current_Month_Calls' }, { $inc: { value: count } });
		return true;
	}

	blockUnsafeImages(message) {
		if (this.enabled && this.serviceAccount && message && message.file && message.file._id) {
			const file = RocketChat.models.Uploads.findOne({ _id: message.file._id });
			if (file && file.type && file.type.indexOf('image') !== -1 && file.store === 'GoogleCloudStorage:Uploads' && file.GoogleStorage) {
				if (this.incCallCount(1)) {
					const bucket = this.storageClient.bucket(RocketChat.settings.get('FileUpload_GoogleStorage_Bucket'));
					const bucketFile = bucket.file(file.GoogleStorage.path);
					const results = Meteor.wrapAsync(this.visionClient.detectSafeSearch, this.visionClient)(bucketFile);
					if (results && results.adult === true) {
						FileUpload.getStore('Uploads').deleteById(file._id);
						const user = RocketChat.models.Users.findOneById(message.u && message.u._id);
						if (user) {
							RocketChat.Notifications.notifyUser(user._id, 'message', {
								_id: Random.id(),
								rid: message.rid,
								ts: new Date,
								msg: TAPi18n.__('Adult_images_are_not_allowed', {}, user.language)
							});
						}
						throw new Meteor.Error('GoogleVisionError: Image blocked');
					}
				} else {
					console.error('Google Vision: Usage limit exceeded');
				}
				return message;
			}
		}
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
			if (file && file.type && file.type.indexOf('image') !== -1 && file.store === 'GoogleCloudStorage:Uploads' && file.GoogleStorage) {
				if (this.incCallCount(visionTypes.length)) {
					const bucket = this.storageClient.bucket(RocketChat.settings.get('FileUpload_GoogleStorage_Bucket'));
					const bucketFile = bucket.file(file.GoogleStorage.path);
					this.visionClient.detect(bucketFile, visionTypes, Meteor.bindEnvironment((error, results) => {
						if (!error) {
							RocketChat.models.Messages.setGoogleVisionData(message._id, this.getAnnotations(visionTypes, results));
						} else {
							console.trace('GoogleVision error: ', error.stack);
						}
					}));
				} else {
					console.error('Google Vision: Usage limit exceeded');
				}
			}
		}
	}

	getAnnotations(visionTypes, visionData) {
		if (visionTypes.length === 1) {
			const _visionData = {};
			_visionData[`${ visionTypes[0] }`] = visionData;
			visionData = _visionData;
		}
		const results = {};
		for (const index in visionData) {
			if (visionData.hasOwnProperty(index)) {
				switch (index) {
					case 'faces':
					case 'landmarks':
					case 'labels':
					case 'similar':
					case 'logos':
						results[index] = (results[index] || []).concat(visionData[index] || []);
						break;
					case 'safeSearch':
						results['safeSearch'] = visionData['safeSearch'];
						break;
					case 'properties':
						results['colors'] = visionData[index]['colors'];
						break;
				}
			}
		}
		return results;
	}
}

RocketChat.GoogleVision = new GoogleVision;
