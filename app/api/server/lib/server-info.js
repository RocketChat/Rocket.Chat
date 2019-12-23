
import { Info } from '../../../utils';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';

const removePatchInfo = (version) => {
	const regex = /(\d+)\.(\d+)/;
	return version.match(regex)[0];
};

export async function getServerInfo({ user }) {
	if (user && await hasRoleAsync(user._id, 'admin')) {
		return {
			info: Info,
		};
	}
	return {
		version: removePatchInfo(Info.version),
	};
}
