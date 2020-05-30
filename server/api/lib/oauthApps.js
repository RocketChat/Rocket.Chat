import { OAuthApps } from '../../../app/models/server/raw';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';

export async function findOAuthApps({ uid }) {
	if (!await hasPermissionAsync(uid, 'manage-oauth-apps')) {
		throw new Error('error-not-allowed');
	}
	return OAuthApps.find().toArray();
}

export async function findOneAuthApp({ clientId, appId }) {
	return OAuthApps.findOneAuthAppByIdOrClientId({ clientId, appId });
}
