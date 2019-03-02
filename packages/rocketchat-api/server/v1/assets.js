import { Meteor } from 'meteor/meteor';
import { RocketChatAssets } from 'meteor/rocketchat:assets';
import Busboy from 'busboy';
import { API } from '../api';

API.v1.addRoute('assets.setAsset', { authRequired: true }, {
	post() {
		const busboy = new Busboy({ headers: this.request.headers });
		const fields = {};
		let asset = {};

		Meteor.wrapAsync((callback) => {
			busboy.on('field', (fieldname, value) => fields[fieldname] = value);
			busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
				const isValidAsset = Object.keys(RocketChatAssets.assets).includes(fieldname);
				if (!isValidAsset) {
					callback(new Meteor.Error('error-invalid-asset', 'Invalid asset'));
				}
				const assetData = [];
				file.on('data', Meteor.bindEnvironment((data) => {
					assetData.push(data);
				}));

				file.on('end', Meteor.bindEnvironment(() => {
					asset = {
						buffer: Buffer.concat(assetData),
						name: fieldname,
						mimetype,
					};
				}));
			}));
			busboy.on('finish', () => callback());
			this.request.pipe(busboy);
		})();
		Meteor.runAsUser(this.userId, () => Meteor.call('setAsset', asset.buffer, asset.mimetype, asset.name));
		if (fields.refreshAllClients) {
			Meteor.runAsUser(this.userId, () => Meteor.call('refreshClients'));
		}
		return API.v1.success();
	},
});

API.v1.addRoute('assets.unsetAsset', { authRequired: true }, {
	post() {
		const { assetName, refreshAllClients } = this.bodyParams;
		const isValidAsset = Object.keys(RocketChatAssets.assets).includes(assetName);
		if (!isValidAsset) {
			throw new Meteor.Error('error-invalid-asset', 'Invalid asset');
		}
		Meteor.runAsUser(this.userId, () => Meteor.call('unsetAsset', assetName));
		if (refreshAllClients) {
			Meteor.runAsUser(this.userId, () => Meteor.call('refreshClients'));
		}
		return API.v1.success();
	},
});
