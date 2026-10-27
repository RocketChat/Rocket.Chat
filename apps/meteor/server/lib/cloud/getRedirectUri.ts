import { settings } from '../../settings';

export function getRedirectUri() {
	return `${settings.get<string>('Site_Url')}/admin/cloud/oauth-callback`.replace(/\/\/admin+/g, '/admin');
}
