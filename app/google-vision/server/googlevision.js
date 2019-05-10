import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';

import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import { Notifications } from '../../notifications';
import { Uploads, Settings, Users, Messages } from '../../models';
import { FileUpload } from '../../file-upload';

class GoogleVision {
	constructor() {
		this.storage = require('@google-cloud/storage');
		this.vision = require('@google-cloud/vision');
		this.storageClient = {};
		this.visionClient = {};
		this.enabled = settings.get('GoogleVision_Enable');
		this.serviceAccount = {};
		settings.get('GoogleVision_Enable', (key, value) => {
			this.enabled = value;
		});
		settings.get('GoogleVision_ServiceAccount', (key, value) => {
			try {
				this.serviceAccount = JSON.parse(value);
				this.storageClient = this.storage({ credentials: this.serviceAccount });
				this.visionClient = this.vision({ credentials: this.serviceAccount });
			} catch (e) {
				this.serviceAccount = {};
			}
		});
		settings.get('GoogleVision_Block_Adult_Images', (key, value) => {
			if (value) {
				callbacks.add('beforeSaveMessage', this.blockUnsafeImages.bind(this), callbacks.priority.MEDIUM, 'googlevision-blockunsafe');
			} else {
				callbacks.remove('beforeSaveMessage', 'googlevision-blockunsafe');
			}
		});
		callbacks.add('afterFileUpload', this.annotate.bind(this));
	}

	incCallCount(count) {
		const currentMonth = new Date().getMonth();
		const maxMonthlyCalls = settings.get('GoogleVision_Max_Monthly_Calls') || 0;
		if (maxMonthlyCalls > 0) {
			if (settings.get('GoogleVision_Current_Month') !== currentMonth) {
				settings.set('GoogleVision_Current_Month', currentMonth);
				if (count > maxMonthlyCalls) {
					return false;
				}
			} else if (count + (settings.get('GoogleVision_Current_Month_Calls') || 0) > maxMonthlyCalls) {
				return false;
			}
		}
		Settings.update({ _id: 'GoogleVision_Current_Month_Calls' }, { $inc: { value: count } });
		return true;
	}

	blockUnsafeImages(message) {
		if (this.enabled && this.serviceAccount && message && message.file && message.file._id) {
			const file = Uploads.findOne({ _id: message.file._id });
			if (file && file.type && file.type.indexOf('image') !== -1 && file.store === 'GoogleCloudStorage:Uploads' && file.GoogleStorage) {
				if (this.incCallCount(1)) {
					const bucket = this.storageClient.bucket(settings.get('FileUpload_GoogleStorage_Bucket'));
					const bucketFile = bucket.file(file.GoogleStorage.path);
					const results = Meteor.wrapAsync(this.visionClient.detectSafeSearch, this.visionClient)(bucketFile);
					if (results && results.adult === true) {
						FileUpload.getStore('Uploads').deleteById(file._id);
						const user = Users.findOneById(message.u && message.u._id);
						if (user) {
							Notifications.notifyUser(user._id, 'message', {
								_id: Random.id(),
								rid: message.rid,
								ts: new Date(),
								msg: TAPi18n.__('Adult_images_are_not_allowed', {}, user.language),
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
		if (settings.get('GoogleVision_Type_Document')) {
			visionTypes.push('document');
		}
		if (settings.get('GoogleVision_Type_Faces')) {
			visionTypes.push('faces');
		}
		if (settings.get('GoogleVision_Type_Landmarks')) {
			visionTypes.push('landmarks');
		}
		if (settings.get('GoogleVision_Type_Labels')) {
			visionTypes.push('labels');
		}
		if (settings.get('GoogleVision_Type_Logos')) {
			visionTypes.push('logos');
		}
		if (settings.get('GoogleVision_Type_Properties')) {
			visionTypes.push('properties');
		}
		if (settings.get('GoogleVision_Type_SafeSearch')) {
			visionTypes.push('safeSearch');
		}
		if (settings.get('GoogleVision_Type_Similar')) {
			visionTypes.push('similar');
		}
		if (this.enabled && this.serviceAccount && visionTypes.length > 0 && message.file && message.file._id) {
			const file = Uploads.findOne({ _id: message.file._id });
			if (file && file.type && file.type.indexOf('image') !== -1 && file.store === 'GoogleCloudStorage:Uploads' && file.GoogleStorage) {
				if (this.incCallCount(visionTypes.length)) {
					const bucket = this.storageClient.bucket(settings.get('FileUpload_GoogleStorage_Bucket'));
					const bucketFile = bucket.file(file.GoogleStorage.path);
					this.visionClient.detect(bucketFile, visionTypes, Meteor.bindEnvironment((error, results) => {
						if (!error) {
							Messages.setGoogleVisionData(message._id, this.getAnnotations(visionTypes, results));
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
						results.safeSearch = visionData.safeSearch;
						break;
					case 'properties':
						results.colors = visionData[index].colors;
						break;
				}
			}
		}
		return results;
	}
}

export default new GoogleVision();
