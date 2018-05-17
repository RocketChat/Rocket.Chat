export function requestCanAccessFiles({ query = {} }) {
	if (!RocketChat.settings.get('FileUpload_ProtectFiles')) {
		return true;
	}

	const { rc_rid, rc_token } = query;

	if (!rc_rid || !rc_token || !RocketChat.models.Rooms.findOneOpenByVisitorToken(rc_token, rc_rid)) {
		return false;
	}

	return true;
}
