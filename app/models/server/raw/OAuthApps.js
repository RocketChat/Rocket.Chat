import { BaseRaw } from './BaseRaw';

export class OAuthAppsRaw extends BaseRaw {
	findOneAuthAppByIdOrClientId({ clientId, appId }) {
		const query = {};
		if (clientId) {
			query.clientId = clientId;
		}
		if (appId) {
			query._id = appId;
		}
		return this.findOne(query);
	}
}
