export function getRedirectUri() {
	return `${ RocketChat.settings.get('Site_Url') }/admin/cloud/oauth-callback`.replace(/\/\/admin+/g, '/admin');
}
