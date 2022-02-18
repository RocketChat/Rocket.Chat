import { OAuthApps } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export async function findOAuthApps({ uid }: { uid: string }): Promise<unknown> {
	if (!(await hasPermissionAsync(uid, 'manage-oauth-apps'))) {
		throw new Error('error-not-allowed');
	}
	return OAuthApps.find().toArray();
}

export async function findOneAuthApp({ clientId, appId }: { clientId: string; appId: string }): Promise<unknown> {
	return OAuthApps.findOneAuthAppByIdOrClientId({ clientId, appId });
}
